export type FrameState = {
  index: number
  progress: number
}

export function getFrameState(time: number, itemCount: number, secondsPerItem: number): FrameState {
  if (itemCount <= 0 || secondsPerItem <= 0) return { index: 0, progress: 0 }
  const total = itemCount * secondsPerItem
  const safeTime = Math.max(0, Math.min(time, total))
  const index = Math.min(Math.floor(safeTime / secondsPerItem), itemCount - 1)
  const progress = safeTime >= total ? 1 : (safeTime - index * secondsPerItem) / secondsPerItem
  return { index, progress }
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items]
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

export function getMimeType(isSupported: (type: string) => boolean): string {
  return MIME_TYPES.find(isSupported) ?? 'video/webm'
}
