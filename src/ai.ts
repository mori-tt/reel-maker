export type AiCopy = { title: string; cta: string }
export type OllamaModel = { name: string; capabilities?: string[] }
export type FileLike = { name: string; type: string }

export function supportsVision(model: OllamaModel): boolean {
  return model.capabilities?.includes('vision') ?? false
}

export function defaultOllamaUrl(): string {
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  const local = host === 'localhost' || host === '127.0.0.1'
  return local ? 'http://localhost:11434' : '/api/ollama'
}

export function initialOllamaUrl(saved: string | null): string {
  const fallback = defaultOllamaUrl()
  if (!saved) return fallback
  const localPage = fallback.startsWith('http://localhost')
  if (!localPage && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(saved)) return fallback
  if (localPage && saved.startsWith('/api/ollama')) return fallback
  return saved
}

export function isHeicFile(file: FileLike): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name)
}

export function normalizeOllamaUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function parseAiCopy(raw: string): AiCopy {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let value: unknown
  try {
    value = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AIの応答をJSONとして読み取れませんでした。')
    value = JSON.parse(match[0])
  }
  if (!value || typeof value !== 'object') throw new Error('AIの応答形式が正しくありません。')
  const candidate = value as Record<string, unknown>
  if (typeof candidate.title !== 'string' || typeof candidate.cta !== 'string') {
    throw new Error('AIからタイトルとCTAを取得できませんでした。')
  }
  return { title: candidate.title.slice(0, 28), cta: candidate.cta.slice(0, 32) }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function listOllamaModels(baseUrl: string): Promise<OllamaModel[]> {
  const root = normalizeOllamaUrl(baseUrl)
  const url = root === '/api/ollama' ? `${root}?path=api/tags` : `${root}/api/tags`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Ollamaのモデル一覧を取得できませんでした（${response.status}）`)
  const payload = await response.json() as { models?: OllamaModel[] }
  return payload.models ?? []
}

export async function generateAiCopy(options: {
  baseUrl: string
  model: string
  image: Blob
  direction?: string
  signal?: AbortSignal
}): Promise<AiCopy> {
  const image = await blobToBase64(options.image)
  const prompt = [
    'あなたはInstagram Reelsの日本語コピーライターです。',
    '画像を見て、短く印象的なタイトル（28文字以内）と、自然なCTA（32文字以内）を1つずつ作ってください。',
    options.direction ? `方向性: ${options.direction}` : '',
    'JSONだけを返してください。形式: {"title":"...","cta":"..."}',
  ].filter(Boolean).join('\n')
  const root = normalizeOllamaUrl(options.baseUrl)
  const url = root === '/api/ollama' ? `${root}?path=api/generate` : `${root}/api/generate`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({ model: options.model.trim(), prompt, images: [image], stream: false, format: 'json' }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Ollamaへの接続に失敗しました（${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ''}`)
  }
  const payload = await response.json() as { response?: string }
  if (!payload.response) throw new Error('Ollamaから応答本文を取得できませんでした。')
  return parseAiCopy(payload.response)
}
