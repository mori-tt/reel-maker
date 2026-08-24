// Google's Gemini API is, in this app, the one AI provider that can actually output new image
// pixels - generating a picture from a text prompt, or editing an existing one according to an
// instruction (swap the background, change the lighting, add/remove an object, ...). That's a
// fundamentally different capability from Chrome's Prompt API and Ollama's vision models used
// elsewhere in this app (ai.ts/chrome-ai.ts): those can only *understand* an image and respond
// with text or a choice from a fixed list, never produce a picture. Routed through the /api/gemini
// serverless proxy (api/gemini.ts) so the API key never reaches the browser, the same pattern as
// the existing /api/ollama proxy for Ollama Cloud.
import type { Language } from './i18n'
import { readErrorDetail } from './ai'

export type GeminiImageResult = { blob: Blob; mimeType: string }

const errors = {
  en: {
    noImage: 'Gemini did not return an image - it may have declined the request as unsafe or unclear. Try a different or more specific prompt.',
    connect: 'Could not reach Gemini',
    response: 'Gemini returned an unexpected response.',
  },
  ja: {
    noImage: 'Geminiから画像が返されませんでした。リクエストが安全性や内容の理由で拒否された可能性があります。表現を変えるか、より具体的な指示にして試してください。',
    connect: 'Geminiへの接続に失敗しました',
    response: 'Geminiから予期しない形式の応答がありました。',
  },
} as const

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Matches the Gemini `generateContent` REST response shape (protobuf-JSON, so camelCase field
// names) closely enough to find an inline image part without needing the full official types.
type GeminiPart = { text?: string; inlineData?: { mimeType?: string; data?: string } }
type GeminiGenerateContentResponse = { candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } }

export function parseGeminiImageResponse(payload: GeminiGenerateContentResponse, language: Language = 'ja'): GeminiImageResult {
  const parts = payload.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find(part => part.inlineData?.data)
  if (!imagePart?.inlineData?.data) throw new Error(errors[language].noImage)
  return { blob: base64ToBlob(imagePart.inlineData.data, imagePart.inlineData.mimeType || 'image/png'), mimeType: imagePart.inlineData.mimeType || 'image/png' }
}

async function callGemini(body: unknown, language: Language): Promise<GeminiImageResult> {
  const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) { const detail = await readErrorDetail(response); throw new Error(`${errors[language].connect} (${response.status})${detail ? `: ${detail}` : ''}`) }
  let payload: GeminiGenerateContentResponse
  try { payload = await response.json() as GeminiGenerateContentResponse } catch { throw new Error(errors[language].response) }
  return parseGeminiImageResponse(payload, language)
}

// Generates a brand new image from a text prompt alone - for adding a custom cover slide,
// background, or decorative image that didn't come from a photo the user took.
export async function generateGeminiImage(options: { prompt: string; language?: Language }): Promise<GeminiImageResult> {
  const language = options.language ?? 'ja'
  return callGemini({ contents: [{ parts: [{ text: options.prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }, language)
}

// Edits an existing photo according to a text instruction. The caller is responsible for keeping
// the original around (App.tsx does, as `slide.original`) so this is never a one-way, unrecoverable
// change from the user's point of view even though it replaces the working image.
export async function editGeminiImage(options: { image: Blob; prompt: string; language?: Language }): Promise<GeminiImageResult> {
  const language = options.language ?? 'ja'
  const data = await blobToBase64(options.image)
  return callGemini({ contents: [{ parts: [{ text: options.prompt }, { inlineData: { mimeType: options.image.type || 'image/jpeg', data } }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }, language)
}

export type ServerConfig = { ollamaCloud: boolean; gemini: boolean }
// A cheap, non-billable check of which server-side API keys are actually configured, so buttons
// that depend on them can be disabled up front with a concrete reason - see api/config.ts.
export async function fetchServerConfig(): Promise<ServerConfig> {
  const response = await fetch('/api/config')
  if (!response.ok) throw new Error(`config (${response.status})`)
  return response.json() as Promise<ServerConfig>
}
