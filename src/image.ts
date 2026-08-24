import { heicTo } from 'heic-to'
import { isHeicFile } from './ai'

export type HeicConverter = (options: {
  blob: Blob
  type: 'image/jpeg'
  quality: number
}) => Promise<Blob>

export async function normalizeImageFile(file: File, convert: HeicConverter = heicTo): Promise<Blob> {
  if (!isHeicFile(file)) return file
  try {
    const converted = await convert({ blob: file, type: 'image/jpeg', quality: .9 })
    if (!(converted instanceof Blob) || converted.size === 0) throw new Error('変換後の画像が空です。')
    return converted
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`${file.name}のHEIC変換に失敗しました${detail ? `: ${detail}` : ''}`)
  }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

// A histogram-based auto-levels pass, order matters here: brightness is solved first (to correct
// exposure toward mid-gray) and contrast second (to stretch what's *now* a better-centered range).
// Doing it the other way round - contrast around the fixed 128 midpoint before brightness - actively
// fights underexposed photos: contrast stretch pulls anything below 128 further down, so a dark
// photo's shadows get pushed even darker before brightness tries to compensate, largely canceling
// it out. Brightness is also capped by 255/max so it can't blow out existing highlights while
// chasing a dark average. Both stay capped overall so an already well-exposed photo gets little to
// no change. Pure function over raw pixel data (not a live image), so the math is unit-testable
// without a real canvas/DOM.
export function computeAutoEnhanceFilter(pixels: Uint8ClampedArray | number[]): string {
  let min = 255, max = 0, sum = 0
  const count = pixels.length / 4
  if (count <= 0) return 'brightness(1) contrast(1) saturate(1.05)'
  for (let i = 0; i < pixels.length; i += 4) {
    const luminance = pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114
    if (luminance < min) min = luminance
    if (luminance > max) max = luminance
    sum += luminance
  }
  const average = sum / count
  const range = Math.max(1, max - min)
  const brightness = clamp(128 / Math.max(1, average), .7, Math.min(2, 255 / Math.max(1, max)))
  const contrast = clamp(220 / (range * brightness), 1, 1.35)
  return `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(1.08)`
}

// Downsamples the image onto a small offscreen canvas (analysis doesn't need full resolution) and
// runs computeAutoEnhanceFilter over it. Browser-only (needs a real canvas), so this is covered by
// the manual/visual verification rather than unit tests - computeAutoEnhanceFilter carries the
// actual logic and is unit-tested directly.
export function analyzeAutoEnhance(image: HTMLImageElement, sampleSize = 80): string {
  const canvas = document.createElement('canvas'); canvas.width = sampleSize; canvas.height = sampleSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'brightness(1) contrast(1) saturate(1.05)'
  ctx.drawImage(image, 0, 0, sampleSize, sampleSize)
  return computeAutoEnhanceFilter(ctx.getImageData(0, 0, sampleSize, sampleSize).data)
}
