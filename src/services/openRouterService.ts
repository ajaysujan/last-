import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const MODEL = process.env.OPENROUTER_MODEL?.trim() || 'google/gemini-3.8-flash';
const X_MODEL = process.env.OPENROUTER_X_MODEL?.trim() || 'x-ai/grok-4.7';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const isOpenRouterConfigured = () => Boolean(apiKey);

export type SearchScope = 'auto' | 'web' | 'wikipedia' | 'x' | 'instagram' | 'china' | 'youtube';

export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<Record<string, any>>;
}

const CHINA_DOMAINS = [
  'baidu.com', 'zhihu.com', 'bilibili.com', 'weibo.com', 'douban.com',
  'xiaohongshu.com', 'qq.com', '163.com', 'sina.com.cn', 'sohu.com',
  'thepaper.cn', 'ifeng.com', 'guancha.cn', 'people.com.cn', 'xinhuanet.com',
  'cnblogs.com', 'huanqiu.com', '36kr.com', 'huxiu.com', 'smzdm.com',
];

export function modelForSearchScope(scope: SearchScope): string {
  return scope === 'x' ? X_MODEL : MODEL;
}

export function searchInstructionForScope(scope: SearchScope): string {
  switch (scope) {
    case 'wikipedia':
      return 'Search Wikipedia first. Prefer Wikipedia pages and clearly cite the exact page URL.';
    case 'x':
      return 'Search X/Twitter first for public posts and discussions. Prefer current X results and cite exact x.com or twitter.com URLs when available.';
    case 'instagram':
      return 'Search Instagram first for public profiles/posts/pages that are indexed. Do not claim access to private or login-only content.';
    case 'china':
      return 'Search the Chinese web first. Prefer relevant public Chinese sources such as Baidu, Zhihu, Bilibili, Weibo, Xiaohongshu, Douban and major Chinese news/knowledge sites. Cite the exact URLs used.';
    case 'youtube':
      return 'Search YouTube first and return direct clickable YouTube video URLs when relevant.';
    case 'web':
      return 'Search the general web and use reliable sources. Cite the exact URLs used.';
    default:
      return 'Choose the most useful web sources automatically. Use official/primary sources when possible.';
  }
}

function buildWebSearchTool(scope: SearchScope): Record<string, any> {
  const tool: Record<string, any> = { type: 'openrouter:web_search' };
  const p: Record<string, any> = { max_results: 8, max_total_results: 16 };

  if (scope === 'x') {
    p.engine = 'native';
    p.allowed_domains = ['x.com', 'twitter.com'];
  } else if (scope === 'wikipedia') {
    p.engine = 'exa';
    p.allowed_domains = ['wikipedia.org'];
  } else if (scope === 'instagram') {
    p.engine = 'exa';
    p.allowed_domains = ['instagram.com'];
  } else if (scope === 'china') {
    p.engine = 'exa';
    p.allowed_domains = CHINA_DOMAINS;
  } else if (scope === 'youtube') {
    p.engine = 'exa';
    p.allowed_domains = ['youtube.com', 'youtu.be'];
  } else if (scope === 'web') {
    p.engine = 'auto';
  }

  tool.parameters = p;
  return tool;
}

function toolsForSearch(scope: SearchScope): Array<Record<string, any>> {
  return [
    buildWebSearchTool(scope),
    { type: 'openrouter:web_fetch' },
  ];
}

export async function generateOpenRouterText(
  messages: ORMessage[],
  opts: { model?: string; signal?: AbortSignal; enableSearch?: boolean; searchScope?: SearchScope } = {},
): Promise<string> {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const scope = opts.searchScope || 'auto';
  const effectiveScope = opts.enableSearch ? scope : 'web';
  const body: Record<string, any> = {
    model: opts.model || modelForSearchScope(effectiveScope),
    messages,
    stream: false,
  };

  if (opts.enableSearch) body.tools = toolsForSearch(scope);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'AURA AI',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${res.status} ${detail.slice(0, 400)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) return content.trim();

  if (Array.isArray(content)) {
    const text = content
      .map((part: any) => typeof part?.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (text) return text;
  }

  throw new Error('OpenRouter returned an empty response');
}

export async function streamOpenRouterChat(
  messages: ORMessage[],
  opts: { model?: string; signal?: AbortSignal; enableSearch?: boolean; searchScope?: SearchScope } = {},
): Promise<AsyncGenerator<string>> {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const scope = opts.searchScope || 'auto';
  const effectiveScope = opts.enableSearch ? scope : 'web';
  const body: Record<string, any> = {
    model: opts.model || modelForSearchScope(effectiveScope),
    messages,
    stream: true,
  };

  if (opts.enableSearch) body.tools = toolsForSearch(scope);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'AURA AI',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${res.status} ${detail.slice(0, 400)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  return (async function* () {
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) buffer += decoder.decode(value, { stream: !done });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) yield delta;
        } catch {}
      }
    }

    if (buffer.trim().startsWith('data:')) {
      const payload = buffer.trim().slice(5).trim();
      if (payload && payload !== '[DONE]') {
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) yield delta;
        } catch {}
      }
    }
  })();
}
