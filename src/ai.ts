export type AiCopy = { title: string; cta: string }
export type OllamaModel = { name: string; model?: string; capabilities?: string[]; details?: { families?: string[] } }
export type FileLike = { name: string; type: string }
export type AiProviderId = 'chrome' | 'ollama-local' | 'ollama-cloud'

export const RECOMMENDED_VISION_MODELS = [
  { name: 'gemma3:4b', note: '軽量な画像対応モデル' },
  { name: 'llama3.2-vision:11b', note: '画像理解に対応' },
  { name: 'qwen2.5vl:7b', note: '画像と日本語に対応' },
] as const

export function supportsVision(model: OllamaModel): boolean {
  if (model.capabilities?.includes('vision')) return true
  const value = `${model.name} ${model.model ?? ''} ${(model.details?.families ?? []).join(' ')}`.toLowerCase()
  return /(vision|llava|bakllava|moondream|gemma3|qwen2\.5vl|qwen3-vl|minicpm-v)/.test(value)
}
export function defaultOllamaUrl() { return 'http://localhost:11434' }
export function initialOllamaUrl(saved: string | null) { return saved && /^https?:\/\//i.test(saved) ? saved : defaultOllamaUrl() }
export function isHeicFile(file: FileLike) { return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name) }
export function normalizeOllamaUrl(url: string) { return url.trim().replace(/\/+$/, '') }
export function parseAiCopy(raw: string): AiCopy {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let value: unknown
  try { value = JSON.parse(cleaned) } catch { const match = cleaned.match(/\{[\s\S]*\}/); if (!match) throw new Error('AIの応答をJSONとして読み取れませんでした。'); value = JSON.parse(match[0]) }
  if (!value || typeof value !== 'object') throw new Error('AIの応答形式が正しくありません。')
  const candidate = value as Record<string, unknown>
  if (typeof candidate.title !== 'string' || typeof candidate.cta !== 'string') throw new Error('AIからタイトルとCTAを取得できませんでした。')
  return { title: candidate.title.slice(0, 28), cta: candidate.cta.slice(0, 32) }
}
export function blobToBase64(blob: Blob): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob) }) }

function ollamaApiUrl(baseUrl: string, path: 'tags' | 'generate', provider: AiProviderId) {
  if (provider === 'ollama-cloud') return `/api/ollama?path=api/${path}&provider=cloud`
  return `${normalizeOllamaUrl(baseUrl)}/api/${path}`
}
export async function listOllamaModels(baseUrl: string, provider: AiProviderId = 'ollama-local'): Promise<OllamaModel[]> {
  const response = await fetch(ollamaApiUrl(baseUrl, 'tags', provider))
  if (!response.ok) throw new Error(`Ollamaのモデル一覧を取得できませんでした（${response.status}）`)
  const payload = await response.json() as { models?: OllamaModel[] }
  return payload.models ?? []
}
export function buildCopyPrompt(options: { direction?: string; customDirection?: string; formatName?: string }) {
  return [
    `あなたは${options.formatName ?? 'SNS動画'}の日本語コピーライターです。`,
    '画像を見て、短く印象的なタイトル（28文字以内）と、自然なCTA（32文字以内）を1つずつ作ってください。',
    options.direction ? `コピーの方向性: ${options.direction}` : '',
    options.customDirection ? `追加の要望: ${options.customDirection}` : '',
    'JSONだけを返してください。形式: {"title":"...","cta":"..."}',
  ].filter(Boolean).join('\n')
}
export async function generateAiCopy(options: { baseUrl: string; provider?: AiProviderId; model: string; image: Blob; direction?: string; customDirection?: string; formatName?: string; signal?: AbortSignal }): Promise<AiCopy> {
  const image = await blobToBase64(options.image)
  const provider = options.provider ?? 'ollama-local'
  const response = await fetch(ollamaApiUrl(options.baseUrl, 'generate', provider), { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: options.signal, body: JSON.stringify({ model: options.model.trim(), prompt: buildCopyPrompt(options), images: [image], stream: false, format: 'json' }) })
  if (!response.ok) { const detail = await response.text().catch(() => ''); throw new Error(`Ollamaへの接続に失敗しました（${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ''}`) }
  const payload = await response.json() as { response?: string }
  if (!payload.response) throw new Error('Ollamaから応答本文を取得できませんでした。')
  return parseAiCopy(payload.response)
}
