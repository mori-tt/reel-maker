import type { Language } from './i18n'

export type AiCopy = { title: string; cta: string }
export type OllamaModel = { name: string; model?: string; capabilities?: string[]; details?: { families?: string[] } }
export type FileLike = { name: string; type: string }
export type AiProviderId = 'chrome' | 'ollama-local' | 'ollama-cloud'

export const RECOMMENDED_VISION_MODELS = [
  { name: 'gemma3:4b', note: { en: 'Lightweight vision model', ja: '軽量な画像対応モデル' } },
  { name: 'llama3.2-vision:11b', note: { en: 'Vision-capable model', ja: '画像理解に対応' } },
  { name: 'qwen2.5vl:7b', note: { en: 'Vision model with Japanese support', ja: '画像と日本語に対応' } },
] as const
export const OLLAMA_LOCAL_CANDIDATES = ['http://localhost:11434', 'http://127.0.0.1:11434'] as const

export function supportsVision(model: OllamaModel): boolean {
  if (model.capabilities?.includes('vision')) return true
  const value = `${model.name} ${model.model ?? ''} ${(model.details?.families ?? []).join(' ')}`.toLowerCase()
  return /(vision|llava|bakllava|moondream|gemma3|qwen2\.5vl|qwen3-vl|minicpm-v)/.test(value)
}
export function defaultOllamaUrl() { return OLLAMA_LOCAL_CANDIDATES[0] }
export function initialOllamaUrl(saved: string | null) { return saved && /^https?:\/\//i.test(saved) ? saved : defaultOllamaUrl() }
export function isHeicFile(file: FileLike) { return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name) }
export function normalizeOllamaUrl(url: string) { return url.trim().replace(/\/+$/, '') }
export function getLocalOllamaCandidates(preferredUrl?: string) { return [...new Set([preferredUrl, ...OLLAMA_LOCAL_CANDIDATES].filter(Boolean).map(url => normalizeOllamaUrl(url as string)))] }

const errors = {
  en: { json: 'The AI response could not be parsed as JSON.', format: 'The AI response format is invalid.', copy: 'The AI response did not include a title and CTA.', models: 'Could not fetch the Ollama model list', detect: 'Local Ollama could not be detected. Make sure Ollama is running.', connect: 'Could not connect to Ollama', response: 'Ollama returned no response body.' },
  ja: { json: 'AIの応答をJSONとして読み取れませんでした。', format: 'AIの応答形式が正しくありません。', copy: 'AIからタイトルとCTAを取得できませんでした。', models: 'Ollamaのモデル一覧を取得できませんでした', detect: 'ローカルOllamaを自動検出できませんでした。Ollamaが起動中か確認してください。', connect: 'Ollamaへの接続に失敗しました', response: 'Ollamaから応答本文を取得できませんでした。' },
} as const

export function parseAiCopy(raw: string, language: Language = 'ja'): AiCopy {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let value: unknown
  try { value = JSON.parse(cleaned) } catch { const match = cleaned.match(/\{[\s\S]*\}/); if (!match) throw new Error(errors[language].json); value = JSON.parse(match[0]) }
  if (!value || typeof value !== 'object') throw new Error(errors[language].format)
  const candidate = value as Record<string, unknown>
  if (typeof candidate.title !== 'string' || typeof candidate.cta !== 'string') throw new Error(errors[language].copy)
  return { title: candidate.title.slice(0, 28), cta: candidate.cta.slice(0, 32) }
}
export function blobToBase64(blob: Blob): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob) }) }
function ollamaApiUrl(baseUrl: string, path: 'tags' | 'generate', provider: AiProviderId) { return provider === 'ollama-cloud' ? `/api/ollama?path=api/${path}&provider=cloud` : `${normalizeOllamaUrl(baseUrl)}/api/${path}` }

export async function listOllamaModels(baseUrl: string, provider: AiProviderId = 'ollama-local', signal?: AbortSignal, language: Language = 'ja'): Promise<OllamaModel[]> {
  const response = await fetch(ollamaApiUrl(baseUrl, 'tags', provider), { signal })
  if (!response.ok) throw new Error(`${errors[language].models} (${response.status})`)
  const payload = await response.json() as { models?: OllamaModel[] }
  return payload.models ?? []
}
export async function discoverLocalOllama(preferredUrl?: string, language: Language = 'ja'): Promise<{ url: string; models: OllamaModel[] }> {
  for (const url of getLocalOllamaCandidates(preferredUrl)) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 1800)
    try { return { url, models: await listOllamaModels(url, 'ollama-local', controller.signal, language) } } catch { /* try next endpoint */ } finally { clearTimeout(timer) }
  }
  throw new Error(errors[language].detect)
}
export function selectVisionModel(models: OllamaModel[], current?: string) { if (current && models.some(model => model.name === current && supportsVision(model))) return current; return models.find(supportsVision)?.name ?? models[0]?.name ?? current ?? '' }
export function buildCopyPrompt(options: { direction?: string; customDirection?: string; formatName?: string; language?: Language }) {
  const language = options.language ?? 'ja'
  return language === 'en' ? [
    `You are an English copywriter for ${options.formatName ?? 'social video'}.`,
    'Look at the image and create one short, memorable title (up to 28 characters) and one natural CTA (up to 32 characters).',
    options.direction ? `Copy direction: ${options.direction}` : '', options.customDirection ? `Additional request: ${options.customDirection}` : '',
    'Return JSON only: {"title":"...","cta":"..."}',
  ].filter(Boolean).join('\n') : [
    `あなたは${options.formatName ?? 'SNS動画'}の日本語コピーライターです。`,
    '画像を見て、短く印象的なタイトル（28文字以内）と、自然なCTA（32文字以内）を1つずつ作ってください。',
    options.direction ? `コピーの方向性: ${options.direction}` : '', options.customDirection ? `追加の要望: ${options.customDirection}` : '',
    'JSONだけを返してください。形式: {"title":"...","cta":"..."}',
  ].filter(Boolean).join('\n')
}
export async function generateAiCopy(options: { baseUrl: string; provider?: AiProviderId; model: string; image: Blob; direction?: string; customDirection?: string; formatName?: string; language?: Language; signal?: AbortSignal }): Promise<AiCopy> {
  const language = options.language ?? 'ja'; const image = await blobToBase64(options.image); const provider = options.provider ?? 'ollama-local'
  const response = await fetch(ollamaApiUrl(options.baseUrl, 'generate', provider), { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: options.signal, body: JSON.stringify({ model: options.model.trim(), prompt: buildCopyPrompt(options), images: [image], stream: false, format: 'json' }) })
  if (!response.ok) { const detail = await response.text().catch(() => ''); throw new Error(`${errors[language].connect} (${response.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`) }
  const payload = await response.json() as { response?: string }
  if (!payload.response) throw new Error(errors[language].response)
  return parseAiCopy(payload.response, language)
}
