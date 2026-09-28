<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/192d53c4-279c-41fc-8985-15a2da79f03b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Provider configuration

Set these server-side environment variables in Render (never in frontend code or Git):

- `GEMINI_API_KEY` — primary Gemini provider.
- `OPENROUTER_API_KEY` — optional fallback provider.
- `OPENROUTER_MODEL` — optional, defaults to `google/gemini-3.1-flash-lite`.

## Recent fixes

- Added a real Stop Generation control using AbortController/stream cancellation.
- Added clearer Copy controls with clipboard fallback.
- Turned automatic voice playback off by default; voice can still be started manually.
- Added an explicit Stop Voice control in the live assistant.
- Connected uploaded PDF/image/TXT data to the AI request instead of only showing an attachment chip.
- Added Gemini-first, OpenRouter-fallback text generation.
- Expanded JSON body size to support document uploads.
- Removed the local `.env` file from the distributable project so secrets are not packaged.

## Web Search
AURA's Smart Search is OFF by default. When enabled, the model decides whether web search is useful. For current/uncertain/niche questions or link/video requests it can search the web and cite clickable Markdown sources. YouTube requests are instructed to prioritize direct YouTube links.

OpenRouter uses the current `openrouter:web_search` server tool. Gemini uses Google Search grounding when search is enabled.

Render environment variables:
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional)

## Expanded web sources
- AURA can search general web results plus source-scoped search for Wikipedia, X/Twitter, Instagram, major Chinese web domains, and YouTube.
- The chat UI includes a Search selector: Auto, Web, Wikipedia, X/Twitter, Instagram, China Web, YouTube.
- X/Twitter searches use OpenRouter with the current Grok 4.7 model by default because OpenRouter documents native X search on Grok 4+; set `OPENROUTER_X_MODEL` to change it.
- Instagram and other public pages are searchable only when they are publicly indexed/accessible; private or login-only content is not scraped.
- Chinese Web means a curated group of major public Chinese domains, not literally every Chinese website.


## Runtime responsiveness
Normal chat keeps web search OFF until the user enables it. Upstream AI calls are bounded by timeouts; when Gemini stalls, AURA can fall back to OpenRouter instead of waiting indefinitely.

## Render
When this repository is uploaded with the `aura_out` folder, set Root Directory to `aura_out`.
Build Command: `npm install && npm run build`
Start Command: `npm start`
