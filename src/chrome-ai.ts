import { buildCaptionPrompt, buildCopyPrompt, parseAiCaption, parseAiCopy } from './ai'
import type { AiCaption, AiCopy, CaptionPlatform } from './ai'
import type { Language } from './i18n'

export type ChromeAiAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'no-api'
type PromptPart = { type: 'text'; value: string } | { type: 'image'; value: Blob }
type PromptMessage = { role: 'user'; content: PromptPart[] }
type LanguageModelSession = { prompt(input: PromptMessage[], options?: { responseConstraint?: object; omitResponseConstraintInput?: boolean }): Promise<string>; destroy(): void }
type LanguageModelApi = { availability(options: object): Promise<ChromeAiAvailability>; create(options: object): Promise<LanguageModelSession> }

function modalities(language: Language) { return { expectedInputs: [{ type: 'text', languages: [language] }, { type: 'image' }], expectedOutputs: [{ type: 'text', languages: [language] }] } }
const responseSchema = { type: 'object', properties: { title: { type: 'string', maxLength: 28 }, cta: { type: 'string', maxLength: 32 } }, required: ['title', 'cta'], additionalProperties: false }
const captionResponseSchema = { type: 'object', properties: { caption: { type: 'string', maxLength: 2200 }, hashtags: { type: 'array', items: { type: 'string' }, maxItems: 20 } }, required: ['caption', 'hashtags'], additionalProperties: false }
const messages = {
  en: { available: 'Chrome AI is available. Images and copy stay on this device.', downloadable: 'The Chrome AI model can be downloaded. Preparing it will start the download.', downloading: 'The Chrome AI model is downloading. Try again when it finishes.', unavailable: 'Vision-capable built-in AI is unavailable in this Chrome. Check Chrome, device, and model requirements.', 'no-api': 'This browser has no Chrome built-in AI (Prompt API). It only exists in Chrome/Edge on desktop today — Safari and Firefox are not supported. Use the Local Ollama or Ollama Cloud tab instead.' },
  ja: { available: 'Chrome AIを利用できます。画像とコピーは端末内で処理されます。', downloadable: 'Chrome AIモデルをダウンロードできます。準備を開始するとダウンロードされます。', downloading: 'Chrome AIモデルをダウンロード中です。完了後に再度お試しください。', unavailable: 'このChromeでは画像対応の組み込みAIを利用できません。対応Chrome・端末要件・モデル設定を確認してください。', 'no-api': 'このブラウザにはChrome組み込みAI（Prompt API）がありません。現時点ではデスクトップ版Chrome／Edge限定の機能で、SafariやFirefoxでは利用できません。「ローカルOllama」または「Ollama Cloud」タブをお使いください。' },
} as const

export function getChromeLanguageModel(scope: typeof globalThis = globalThis): LanguageModelApi | null { return (scope as typeof globalThis & { LanguageModel?: LanguageModelApi }).LanguageModel ?? null }
export async function getChromeAiAvailability(api = getChromeLanguageModel(), language: Language = 'ja'): Promise<ChromeAiAvailability> { if (!api) return 'no-api'; try { return await api.availability(modalities(language)) } catch { return 'unavailable' } }
export function chromeAiAvailabilityMessage(status: ChromeAiAvailability, language: Language = 'ja'): string { return messages[language][status] }
export async function prepareChromeAi(options: { onDownloadProgress?: (progress: number) => void; api?: LanguageModelApi | null; language?: Language } = {}): Promise<ChromeAiAvailability> {
  const language = options.language ?? 'ja'; const api = options.api ?? getChromeLanguageModel(); if (!api) return 'no-api'
  const availability = await getChromeAiAvailability(api, language); if (availability === 'unavailable' || availability === 'downloading' || availability === 'no-api') return availability
  if (availability === 'downloadable') { const session = await api.create({ ...modalities(language), monitor(monitor: EventTarget) { monitor.addEventListener('downloadprogress', event => options.onDownloadProgress?.(Math.round(Number((event as Event & { loaded?: number }).loaded ?? 0) * 100))) } }); session.destroy() }
  return getChromeAiAvailability(api, language)
}
export async function generateChromeAiCopy(options: { image: Blob; direction?: string; customDirection?: string; formatName?: string; language?: Language; onDownloadProgress?: (progress: number) => void; api?: LanguageModelApi | null }): Promise<AiCopy> {
  const language = options.language ?? 'ja'; const api = options.api ?? getChromeLanguageModel(); if (!api) throw new Error(messages[language]['no-api'])
  const availability = await getChromeAiAvailability(api, language); if (availability === 'unavailable' || availability === 'downloading' || availability === 'no-api') throw new Error(chromeAiAvailabilityMessage(availability, language))
  const session = await api.create({ ...modalities(language), monitor(monitor: EventTarget) { monitor.addEventListener('downloadprogress', event => options.onDownloadProgress?.(Math.round(Number((event as Event & { loaded?: number }).loaded ?? 0) * 100))) } })
  try { const instruction = buildCopyPrompt({ direction: options.direction, customDirection: options.customDirection, formatName: options.formatName, language }); const raw = await session.prompt([{ role: 'user', content: [{ type: 'text', value: instruction }, { type: 'image', value: options.image }] }], { responseConstraint: responseSchema, omitResponseConstraintInput: true }); return parseAiCopy(raw, language) } finally { session.destroy() }
}
export async function generateChromeAiCaption(options: { image: Blob; platform: CaptionPlatform; title?: string; direction?: string; customDirection?: string; language?: Language; onDownloadProgress?: (progress: number) => void; api?: LanguageModelApi | null }): Promise<AiCaption> {
  const language = options.language ?? 'ja'; const api = options.api ?? getChromeLanguageModel(); if (!api) throw new Error(messages[language]['no-api'])
  const availability = await getChromeAiAvailability(api, language); if (availability === 'unavailable' || availability === 'downloading' || availability === 'no-api') throw new Error(chromeAiAvailabilityMessage(availability, language))
  const session = await api.create({ ...modalities(language), monitor(monitor: EventTarget) { monitor.addEventListener('downloadprogress', event => options.onDownloadProgress?.(Math.round(Number((event as Event & { loaded?: number }).loaded ?? 0) * 100))) } })
  try { const instruction = buildCaptionPrompt({ platform: options.platform, title: options.title, direction: options.direction, customDirection: options.customDirection, language }); const raw = await session.prompt([{ role: 'user', content: [{ type: 'text', value: instruction }, { type: 'image', value: options.image }] }], { responseConstraint: captionResponseSchema, omitResponseConstraintInput: true }); return parseAiCaption(raw, language) } finally { session.destroy() }
}
