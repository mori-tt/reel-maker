export type FrameState = {
  index: number
  progress: number
}

export type VideoPatternId = 'cinematic' | 'dynamic' | 'minimal' | 'album' | 'social'

export type VideoPattern = {
  id: VideoPatternId
  name: string
  description: string
  accent: string
}

export type PatternFrame = {
  scale: number
  translateX: number
  translateY: number
  rotation: number
  imageOpacity: number
  textOpacity: number
  textTranslateY: number
  textScale: number
  overlayOpacity: number
}

export const VIDEO_PATTERNS: readonly VideoPattern[] = [
  { id: 'cinematic', name: 'シネマティック', description: 'ゆっくりズーム＋深いフェード', accent: '#b9ff66' },
  { id: 'dynamic', name: 'ダイナミック', description: '速いズーム＋横スライド', accent: '#ff725e' },
  { id: 'minimal', name: 'ミニマル', description: '静かな切り替え＋控えめな文字', accent: '#f4f0e8' },
  { id: 'album', name: 'フォトアルバム', description: '柔らかなパン＋クロスフェード', accent: '#ffd6a5' },
  { id: 'social', name: 'SNSトレンド', description: '短いカット＋ポップな強調', accent: '#75e6ff' },
] as const

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(value, max))
const enterExit = (progress: number, duration: number) => clamp(Math.min(progress / duration, (1 - progress) / duration))
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3
const pop = (progress: number) => progress < .16 ? 1 + Math.sin(clamp(progress / .16) * Math.PI) * .12 : 1

export function isVideoPatternId(value: string | null): value is VideoPatternId {
  return VIDEO_PATTERNS.some(pattern => pattern.id === value)
}

export function getVideoPattern(id: VideoPatternId): VideoPattern {
  return VIDEO_PATTERNS.find(pattern => pattern.id === id) ?? VIDEO_PATTERNS[0]
}

export function getPatternFrame(pattern: VideoPatternId, progress: number, index = 0): PatternFrame {
  const p = clamp(progress)
  if (pattern === 'dynamic') {
    return {
      scale: 1.12 - p * .04,
      translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 9,
      translateY: 0,
      rotation: (index % 2 === 0 ? -1 : 1) * (1 - p) * .8,
      imageOpacity: Math.max(.18, enterExit(p, .09)),
      textOpacity: enterExit(p, .11),
      textTranslateY: (1 - easeOut(p)) * 34,
      textScale: pop(p),
      overlayOpacity: .78,
    }
  }
  if (pattern === 'minimal') {
    return {
      scale: 1.015 + p * .015,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      imageOpacity: Math.max(.35, enterExit(p, .24)),
      textOpacity: enterExit(p, .28),
      textTranslateY: (1 - easeOut(p)) * 10,
      textScale: 1,
      overlayOpacity: .68,
    }
  }
  if (pattern === 'album') {
    return {
      scale: 1.08,
      translateX: (index % 2 === 0 ? -1 : 1) * (5 - p * 10),
      translateY: (index % 3 - 1) * (2 - p * 4),
      rotation: 0,
      imageOpacity: Math.max(.16, enterExit(p, .22)),
      textOpacity: enterExit(p, .2),
      textTranslateY: (1 - easeOut(p)) * 18,
      textScale: 1,
      overlayOpacity: .74,
    }
  }
  if (pattern === 'social') {
    const beat = Math.sin(p * Math.PI * 6) * Math.max(0, 1 - p) * .018
    return {
      scale: 1.07 + beat,
      translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 4,
      translateY: 0,
      rotation: 0,
      imageOpacity: Math.max(.22, enterExit(p, .06)),
      textOpacity: enterExit(p, .07),
      textTranslateY: (1 - easeOut(p)) * -20,
      textScale: pop(p),
      overlayOpacity: .7,
    }
  }
  return {
    scale: 1 + p * .08,
    translateX: 0,
    translateY: 0,
    rotation: 0,
    imageOpacity: Math.max(.12, enterExit(p, .16)),
    textOpacity: enterExit(p, .16),
    textTranslateY: (1 - easeOut(p)) * 24,
    textScale: 1,
    overlayOpacity: .88,
  }
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
