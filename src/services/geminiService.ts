import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SERVER-SIDE ONLY. Never import this file from frontend code.
 *
 * Uses a single key from the GEMINI_API_KEY environment variable.
 * On a temporary error (rate limit / overloaded / network) the request is
 * retried once after a short pause, then a safe error is returned.
 */
const apiKey = process.env.GEMINI_API_KEY?.trim();
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const isGeminiConfigured = () => client !== null;

const MAX_ATTEMPTS = 2; // hard cap: 1 try + 1 retry
const RETRY_DELAY_MS = 1500;

export type AiErrorCode =
  | 'not_configured'
  | 'unavailable'
  | 'empty_response'
  | 'bad_request';

/** Safe, user-facing error. Never contains keys or provider internals. */
export class AiServiceError extends Error {
  constructor(public code: AiErrorCode, message = 'AI service is temporarily unavailable. Please try again.') {
    super(message);
    this.name = 'AiServiceError';
  }
}

export const SAFE_AI_ERROR_MESSAGE = 'AI service is temporarily unavailable. Please try again.';

function errorStatus(err: any): number | undefined {
  const s = err?.status ?? err?.code ?? err?.error?.code;
  return typeof s === 'number' ? s : Number.isFinite(Number(s)) ? Number(s) : undefined;
}

/** Only temporary errors are worth a retry (rate limit, overload, network). */
function isTemporaryError(err: any): boolean {
  const status = errorStatus(err);
  if (status && [408, 429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || '').toLowerCase();
  return /rate limit|resource.?exhausted|unavailable|overloaded|timeout|timed out|fetch failed|econnreset|enotfound|etimedout|network/.test(msg);
}

async function withRetry<T>(operation: (client: GoogleGenAI) => Promise<T>): Promise<T> {
  if (!client) {
    console.error('[gemini] GEMINI_API_KEY is not configured');
    throw new AiServiceError('not_configured');
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await operation(client);
    } catch (err: any) {
      const status = errorStatus(err) ?? 'n/a';
      if (attempt < MAX_ATTEMPTS && isTemporaryError(err)) {
        console.warn(`[gemini] temporary error (status ${status}); retrying`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      // invalid key, quota exhausted, bad request, or retries used up
      console.error(`[gemini] request failed (status ${status})`);
      throw new AiServiceError('unavailable');
    }
  }
  throw new AiServiceError('unavailable');
}

export interface ChatMessagePart {
  role: 'user' | 'model';
  parts: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string; displayName?: string };
  }>;
}

export interface StreamChatOptions {
  model?: string;
  contents: ChatMessagePart[];
  systemInstruction?: string;
  enableSearch?: boolean;
}

// Models are configurable via env so they can be changed on Render without a redeploy of code.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL?.trim() || 'gemini-3.8-flash';
const TTS_MODEL = process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.8-flash-tts';

function buildConfig(systemInstruction?: string, enableSearch = false) {
  const config: Record<string, any> = {};
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (enableSearch) config.tools = [{ googleSearch: {} }];
  return config;
}

/**
 * Opens a stream. The first chunk is awaited here too, so an error that only
 * surfaces on the first read is caught (and retried) instead of giving an empty reply.
 */
export async function streamGeminiChat(options: StreamChatOptions): Promise<AsyncGenerator<string>> {
  const { model = TEXT_MODEL, contents, systemInstruction, enableSearch = false } = options;
  const config = buildConfig(systemInstruction, enableSearch);

  return withRetry(async (client) => {
    const stream = await client.models.generateContentStream({ model, contents, config });
    const iterator = stream[Symbol.asyncIterator]();
    const first = await iterator.next();

    async function* texts(): AsyncGenerator<string> {
      let current = first;
      while (!current.done) {
        const text = current.value?.text;
        if (text) yield text;
        current = await iterator.next();
      }
    }
    return texts();
  });
}

/** Returns the reply text. Throws AiServiceError('empty_response') if Gemini returned nothing. */
export async function generateGeminiText(
  promptOrContents: string | ChatMessagePart[],
  systemInstruction?: string,
  enableSearch = false,
): Promise<string> {
  const response = await withRetry((client) =>
    client.models.generateContent({
      model: TEXT_MODEL,
      contents: promptOrContents,
      config: buildConfig(systemInstruction, enableSearch),
    }),
  );
  const text = response?.text?.trim();
  if (!text) throw new AiServiceError('empty_response');
  return text;
}

export async function generateGeminiSpeech(text: string, voiceName = 'Kore') {
  return withRetry((client) =>
    client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  );
}

export async function generateGeminiStructuredJson<T = any>(prompt: string): Promise<T> {
  const response = await withRetry((client) =>
    client.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }),
  );
  const raw = response?.text?.trim();
  if (!raw) throw new AiServiceError('empty_response');
  try {
    return JSON.parse(raw.replace(/^```(?:json)?|```$/g, '').trim()) as T;
  } catch {
    throw new AiServiceError('empty_response'); // malformed response
  }
}
