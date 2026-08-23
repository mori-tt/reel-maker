import { buildCopyPrompt, parseAiCopy } from './ai'
import type { AiCopy } from './ai'

export type ChromeAiAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable'

type PromptPart = { type: 'text'; value: string } | { type: 'image'; value: Blob }
type PromptMessage = { role: 'user'; content: PromptPart[] }
type LanguageModelSession = {
  prompt(input: PromptMessage[], options?: { responseConstraint?: object; omitResponseConstraintInput?: boolean }): Promise<string>
  destroy(): void
}
type LanguageModelApi = {
  availability(options: object): Promise<ChromeAiAvailability>
  create(options: object): Promise<LanguageModelSession>
}

const modalities = {
  expectedInputs: [
    { type: 'text', languages: ['ja'] },
    { type: 'image' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['ja'] }],
}

const responseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 28 },
    cta: { type: 'string', maxLength: 32 },
  },
  required: ['title', 'cta'],
  additionalProperties: false,
}

export function getChromeLanguageModel(scope: typeof globalThis = globalThis): LanguageModelApi | null {
  return (scope as typeof globalThis & { LanguageModel?: LanguageModelApi }).LanguageModel ?? null
}

export async function getChromeAiAvailability(api = getChromeLanguageModel()): Promise<ChromeAiAvailability> {
  if (!api) return 'unavailable'
  try {
    return await api.availability(modalities)
  } catch {
    return 'unavailable'
  }
}

export function chromeAiAvailabilityMessage(status: ChromeAiAvailability): string {
  if (status === 'available') return 'Chrome AIを利用できます。画像とコピーは端末内で処理されます。'
  if (status === 'downloadable') return 'Chrome AIモデルをダウンロードできます。提案ボタンを押すと準備を始めます。'
  if (status === 'downloading') return 'Chrome AIモデルをダウンロード中です。完了後に再度お試しください。'
  return 'このChromeでは画像対応の組み込みAIを利用できません。対応Chrome・端末要件・モデル設定を確認してください。'
}

export async function prepareChromeAi(options: { onDownloadProgress?: (progress: number) => void; api?: LanguageModelApi | null } = {}): Promise<ChromeAiAvailability> {
  const api = options.api ?? getChromeLanguageModel()
  if (!api) return 'unavailable'
  const availability = await getChromeAiAvailability(api)
  if (availability === 'unavailable' || availability === 'downloading') return availability
  if (availability === 'downloadable') {
    const session = await api.create({
      ...modalities,
      monitor(monitor: EventTarget) {
        monitor.addEventListener('downloadprogress', event => {
          const loaded = Number((event as Event & { loaded?: number }).loaded ?? 0)
          options.onDownloadProgress?.(Math.round(loaded * 100))
        })
      },
    })
    session.destroy()
  }
  return getChromeAiAvailability(api)
}

export async function generateChromeAiCopy(options: {
  image: Blob
  direction?: string
  customDirection?: string
  formatName?: string
  onDownloadProgress?: (progress: number) => void
  api?: LanguageModelApi | null
}): Promise<AiCopy> {
  const api = options.api ?? getChromeLanguageModel()
  if (!api) throw new Error('このブラウザではChrome組み込みAIを利用できません。')
  const availability = await getChromeAiAvailability(api)
  if (availability === 'unavailable') throw new Error(chromeAiAvailabilityMessage(availability))
  if (availability === 'downloading') throw new Error(chromeAiAvailabilityMessage(availability))

  const session = await api.create({
    ...modalities,
    monitor(monitor: EventTarget) {
      monitor.addEventListener('downloadprogress', event => {
        const loaded = Number((event as Event & { loaded?: number }).loaded ?? 0)
        options.onDownloadProgress?.(Math.round(loaded * 100))
      })
    },
  })
  try {
    const instruction = buildCopyPrompt({ direction: options.direction, customDirection: options.customDirection, formatName: options.formatName })
    const raw = await session.prompt([
      { role: 'user', content: [{ type: 'text', value: instruction }, { type: 'image', value: options.image }] },
    ], { responseConstraint: responseSchema, omitResponseConstraintInput: true })
    return parseAiCopy(raw)
  } finally {
    session.destroy()
  }
}
