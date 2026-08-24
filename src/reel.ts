export type FrameState = { index: number; progress: number }
export type VideoPatternId = 'cinematic' | 'dynamic' | 'minimal' | 'album' | 'social' | 'noir' | 'neon' | 'polaroid'
export type VideoFormatId = 'reel' | 'story' | 'feed-portrait' | 'square' | 'shorts'
export type VideoQualityId = 'standard' | 'high'

export type LocalizedText = { en: string; ja: string }
export type PatternDecoration = 'letterbox' | 'vignette' | 'frame' | 'badge' | 'none' | 'grain' | 'scanlines' | 'polaroid'
export type VideoPattern = { id: VideoPatternId; name: LocalizedText; description: LocalizedText; accent: string; copyDirection: LocalizedText; filter: string; decoration: PatternDecoration }
export type VideoFormat = { id: VideoFormatId; name: LocalizedText; description: LocalizedText; width: number; height: number; safeTop: number; safeBottom: number; fileName: string }
export type VideoQuality = { id: VideoQualityId; name: LocalizedText; fps: number; bitsPerSecond: number; scale: number; description: LocalizedText }
export type PatternFrame = { scale: number; translateX: number; translateY: number; rotation: number; imageOpacity: number; textOpacity: number; textTranslateY: number; textScale: number; overlayOpacity: number; flashOpacity: number }

// Beyond motion speed, each pattern gets its own color grade (`filter`, valid as both a CSS and a
// Canvas2D filter string) and a signature decoration so the five looks read as distinct edits
// rather than the same pan/zoom with different numbers.
export const VIDEO_PATTERNS: readonly VideoPattern[] = [
  { id: 'cinematic', name: { en: 'Cinematic', ja: 'シネマティック' }, description: { en: 'Slow zoom + letterbox + deep fade', ja: 'ゆっくりズーム＋レターボックス＋深いフェード' }, accent: '#b9ff66', copyDirection: { en: 'Use cinematic, lingering language that conveys the scene and emotion quietly.', ja: '余韻のある映画的な言葉。情景と感情を静かに伝える' }, filter: 'contrast(1.1) saturate(.82) brightness(.95)', decoration: 'letterbox' },
  { id: 'dynamic', name: { en: 'Dynamic', ja: 'ダイナミック' }, description: { en: 'Fast zoom + slide + flash cuts', ja: '速いズーム＋横スライド＋フラッシュカット' }, accent: '#ff725e', copyDirection: { en: 'Use short, powerful language with an energetic call to action.', ja: '短く力強い言葉。行動を促すテンポのよいコピー' }, filter: 'contrast(1.18) saturate(1.4) brightness(1.03)', decoration: 'none' },
  { id: 'minimal', name: { en: 'Minimal', ja: 'ミニマル' }, description: { en: 'Quiet cuts + soft vignette', ja: '静かな切り替え＋柔らかいビネット' }, accent: '#f4f0e8', copyDirection: { en: 'Use concise, elegant language and leave visual breathing room.', ja: '簡潔で上品な言葉。情報を詰め込まず余白を残す' }, filter: 'contrast(.97) saturate(.88) brightness(1.04)', decoration: 'vignette' },
  { id: 'album', name: { en: 'Photo album', ja: 'フォトアルバム' }, description: { en: 'Gentle pan + warm frame', ja: '柔らかなパン＋温かみのあるフレーム' }, accent: '#ffd6a5', copyDirection: { en: 'Use warm, relatable language that feels like sharing a memory.', ja: '思い出を語る温かい言葉。親しみや共感を大切にする' }, filter: 'sepia(.18) contrast(1.03) saturate(1.08)', decoration: 'frame' },
  { id: 'social', name: { en: 'Social trend', ja: 'SNSトレンド' }, description: { en: 'Quick cuts + bold accent badge', ja: '短いカット＋ポップなアクセントバッジ' }, accent: '#75e6ff', copyDirection: { en: 'Open with a timely hook that naturally encourages saves and shares.', ja: '冒頭で惹きつける旬の表現。保存やシェアにつながるコピー' }, filter: 'contrast(1.22) saturate(1.55)', decoration: 'badge' },
  { id: 'noir', name: { en: 'Noir', ja: 'フィルムノワール' }, description: { en: 'Dramatic zoom + grayscale + film grain', ja: 'ドラマチックなズーム＋モノクロ＋フィルム粒子' }, accent: '#dcdcdc', copyDirection: { en: 'Use terse, dramatic language with an air of mystery.', ja: '簡潔で緊張感のある、ミステリアスな言葉を使う' }, filter: 'grayscale(1) contrast(1.35) brightness(.92)', decoration: 'grain' },
  { id: 'neon', name: { en: 'Neon', ja: 'ネオン' }, description: { en: 'Pulsing zoom + scan lines + electric color', ja: '脈打つズーム＋走査線＋電飾カラー' }, accent: '#00f0ff', copyDirection: { en: 'Use bold, high-energy language with a nightlife edge.', ja: '大胆でハイテンションな、ナイトライフ感のある言葉を使う' }, filter: 'contrast(1.3) saturate(1.7) brightness(1.05) hue-rotate(-6deg)', decoration: 'scanlines' },
  { id: 'polaroid', name: { en: 'Polaroid', ja: 'ポラロイド' }, description: { en: 'Gentle drift + instant-photo border + faded tone', ja: '柔らかな漂うような動き＋ポラロイド風フレーム＋褪せた色調' }, accent: '#f5e6c8', copyDirection: { en: 'Use casual, personal language, like a caption scribbled by hand.', ja: '手書きのメモのような、カジュアルで個人的な言葉を使う' }, filter: 'sepia(.1) contrast(.93) saturate(.82) brightness(1.08)', decoration: 'polaroid' },
] as const

export const VIDEO_FORMATS: readonly VideoFormat[] = [
  { id: 'reel', name: { en: 'Instagram Reel', ja: 'Instagramリール' }, description: { en: '9:16 vertical short video', ja: '9:16・縦型ショート' }, width: 1080, height: 1920, safeTop: .08, safeBottom: .18, fileName: 'instagram-reel' },
  { id: 'story', name: { en: 'Instagram Story', ja: 'Instagramストーリー' }, description: { en: '9:16 with top and bottom UI safe areas', ja: '9:16・上下UI安全領域' }, width: 1080, height: 1920, safeTop: .14, safeBottom: .2, fileName: 'instagram-story' },
  { id: 'feed-portrait', name: { en: 'Portrait feed', ja: 'フィード縦型' }, description: { en: '4:5 Instagram post', ja: '4:5・Instagram投稿' }, width: 1080, height: 1350, safeTop: .06, safeBottom: .1, fileName: 'feed-portrait' },
  { id: 'square', name: { en: 'Square feed', ja: 'フィード正方形' }, description: { en: '1:1 social post', ja: '1:1・汎用SNS投稿' }, width: 1080, height: 1080, safeTop: .06, safeBottom: .1, fileName: 'feed-square' },
  { id: 'shorts', name: { en: 'YouTube Shorts', ja: 'YouTube Shorts' }, description: { en: '9:16 with right-side UI allowance', ja: '9:16・右側UIを考慮' }, width: 1080, height: 1920, safeTop: .08, safeBottom: .16, fileName: 'youtube-shorts' },
] as const

export const VIDEO_QUALITIES: readonly VideoQuality[] = [
  { id: 'standard', name: { en: 'Standard', ja: '標準' }, fps: 30, bitsPerSecond: 16_000_000, scale: 1, description: { en: '1080p · balanced file size', ja: '1080p・標準ファイルサイズ' } },
  { id: 'high', name: { en: 'High quality', ja: '高画質' }, fps: 60, bitsPerSecond: 42_000_000, scale: 1, description: { en: '1080p · 60fps · high bitrate', ja: '1080p・60fps・高ビットレート' } },
] as const

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(value, max))
const enterExit = (progress: number, duration: number) => clamp(Math.min(progress / duration, (1 - progress) / duration))
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3
const pop = (progress: number) => progress < .16 ? 1 + Math.sin(clamp(progress / .16) * Math.PI) * .12 : 1

export function isVideoPatternId(value: string | null): value is VideoPatternId { return VIDEO_PATTERNS.some(item => item.id === value) }
export function isVideoFormatId(value: string | null): value is VideoFormatId { return VIDEO_FORMATS.some(item => item.id === value) }
export function isVideoQualityId(value: string | null): value is VideoQualityId { return VIDEO_QUALITIES.some(item => item.id === value) }
export function getVideoPattern(id: VideoPatternId) { return VIDEO_PATTERNS.find(item => item.id === id) ?? VIDEO_PATTERNS[0] }
export function getVideoFormat(id: VideoFormatId) { return VIDEO_FORMATS.find(item => item.id === id) ?? VIDEO_FORMATS[0] }
export function getVideoQuality(id: VideoQualityId) { return VIDEO_QUALITIES.find(item => item.id === id) ?? VIDEO_QUALITIES[0] }

const flashPulse = (progress: number, duration = .1) => Math.max(0, 1 - progress / duration) ** 2 * .55

function basePatternFrame(pattern: VideoPatternId, progress: number, index = 0): PatternFrame {
  const p = clamp(progress)
  if (pattern === 'dynamic') return { scale: 1.12 - p * .04, translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 9, translateY: 0, rotation: (index % 2 === 0 ? -1 : 1) * (1 - p) * .8, imageOpacity: Math.max(.18, enterExit(p, .09)), textOpacity: enterExit(p, .11), textTranslateY: (1 - easeOut(p)) * 34, textScale: pop(p), overlayOpacity: .78, flashOpacity: flashPulse(p) }
  if (pattern === 'minimal') return { scale: 1.015 + p * .015, translateX: 0, translateY: 0, rotation: 0, imageOpacity: Math.max(.35, enterExit(p, .24)), textOpacity: enterExit(p, .28), textTranslateY: (1 - easeOut(p)) * 10, textScale: 1, overlayOpacity: .68, flashOpacity: 0 }
  if (pattern === 'album') return { scale: 1.08, translateX: (index % 2 === 0 ? -1 : 1) * (5 - p * 10), translateY: (index % 3 - 1) * (2 - p * 4), rotation: 0, imageOpacity: Math.max(.16, enterExit(p, .22)), textOpacity: enterExit(p, .2), textTranslateY: (1 - easeOut(p)) * 18, textScale: 1, overlayOpacity: .74, flashOpacity: 0 }
  if (pattern === 'social') { const beat = Math.sin(p * Math.PI * 6) * Math.max(0, 1 - p) * .018; return { scale: 1.07 + beat, translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 4, translateY: 0, rotation: 0, imageOpacity: Math.max(.22, enterExit(p, .06)), textOpacity: enterExit(p, .07), textTranslateY: (1 - easeOut(p)) * -20, textScale: pop(p), overlayOpacity: .7, flashOpacity: 0 } }
  if (pattern === 'noir') return { scale: 1 + p * .1, translateX: 0, translateY: 0, rotation: (index % 2 === 0 ? 1 : -1) * p * .3, imageOpacity: Math.max(.15, enterExit(p, .2)), textOpacity: enterExit(p, .22), textTranslateY: (1 - easeOut(p)) * 20, textScale: 1, overlayOpacity: .82, flashOpacity: 0 }
  if (pattern === 'neon') { const beat = Math.sin(p * Math.PI * 8) * Math.max(0, 1 - p) * .025; return { scale: 1.05 + beat, translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 6, translateY: 0, rotation: 0, imageOpacity: Math.max(.2, enterExit(p, .08)), textOpacity: enterExit(p, .09), textTranslateY: (1 - easeOut(p)) * -24, textScale: pop(p), overlayOpacity: .72, flashOpacity: 0 } }
  if (pattern === 'polaroid') return { scale: 1.02 + p * .02, translateX: (index % 2 === 0 ? -1 : 1) * (3 - p * 6), translateY: 2 - p * 4, rotation: (index % 3 - 1) * .6, imageOpacity: Math.max(.2, enterExit(p, .22)), textOpacity: enterExit(p, .24), textTranslateY: (1 - easeOut(p)) * 14, textScale: 1, overlayOpacity: .7, flashOpacity: 0 }
  return { scale: 1 + p * .08, translateX: 0, translateY: 0, rotation: 0, imageOpacity: Math.max(.12, enterExit(p, .16)), textOpacity: enterExit(p, .16), textTranslateY: (1 - easeOut(p)) * 24, textScale: 1, overlayOpacity: .88, flashOpacity: 0 }
}

// A fixed zoom/pan/rotation range calibrated for a ~3s hold reads as barely-there motion once
// users pick an 8s hold (now possible with few photos) and as an overshoot at the fastest allowed
// duration. Scale the *amount* of motion (not its timing curve) by how long the image is actually
// held, so the rate of movement stays roughly consistent instead of the range being fixed. Uses a
// square root so the effect tapers off rather than growing linearly without bound, and is clamped
// to a sane range as a safety net for callers that pass unexpected values.
const REFERENCE_DURATION_SECONDS = 3
export function motionMultiplier(durationSeconds: number): number {
  if (!(durationSeconds > 0)) return 1
  return clamp(Math.sqrt(durationSeconds / REFERENCE_DURATION_SECONDS), .7, 1.8)
}
export function getPatternFrame(pattern: VideoPatternId, progress: number, index = 0, durationSeconds: number = REFERENCE_DURATION_SECONDS): PatternFrame {
  const frame = basePatternFrame(pattern, progress, index)
  const m = motionMultiplier(durationSeconds)
  return { ...frame, scale: 1 + (frame.scale - 1) * m, translateX: frame.translateX * m, translateY: frame.translateY * m, rotation: frame.rotation * m }
}

export function getFrameState(time: number, itemCount: number, secondsPerItem: number): FrameState {
  if (itemCount <= 0 || secondsPerItem <= 0) return { index: 0, progress: 0 }
  const total = itemCount * secondsPerItem
  const safeTime = Math.max(0, Math.min(time, total))
  const index = Math.min(Math.floor(safeTime / secondsPerItem), itemCount - 1)
  return { index, progress: safeTime >= total ? 1 : (safeTime - index * secondsPerItem) / secondsPerItem }
}
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] { const next = [...items]; if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next }
// With many photos, a short per-image duration makes the cuts feel like a flicker rather than a
// story. Raise the floor a little as the count grows so adding photos can't make the video feel
// rushed. Paired with maxSecondsPerImage below, which pulls the ceiling down as the count grows,
// so a large batch can't run away into an overly long total either. Callers should clamp the
// current value into [min, max] on every change.
export function minSecondsPerImage(slideCount: number): number {
  if (slideCount <= 8) return 2
  if (slideCount <= 16) return 3
  return 4
}
export function maxSecondsPerImage(slideCount: number): number {
  if (slideCount <= 8) return 8
  if (slideCount <= 16) return 6
  return 4
}
const MIME_TYPES = ['video/webm;codecs=av01', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
export function getMimeType(isSupported: (type: string) => boolean) { return MIME_TYPES.find(isSupported) ?? 'video/webm' }
export function nextFrameDelayMs(start: number, frameIndex: number, fps: number, now: number): number { return Math.max(0, start + (frameIndex * 1000) / fps - now) }
