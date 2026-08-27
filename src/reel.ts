export type FrameState = { index: number; progress: number }
export type VideoPatternId = 'cinematic' | 'dynamic' | 'minimal' | 'album' | 'social' | 'noir' | 'neon' | 'polaroid' | 'vhs' | 'glow' | 'comic' | 'editorial' | 'pastel' | 'retrowave' | 'street' | 'luxury' | 'travel' | 'kawaii'
export type VideoFormatId = 'reel' | 'story' | 'feed-portrait' | 'square' | 'feed-landscape' | 'shorts' | 'tiktok' | 'tiktok-square' | 'youtube-video' | 'youtube-square'
export type VideoQualityId = 'standard' | 'high' | 'ultra'
export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type TransitionType = 'cut' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'wipe-left' | 'wipe-right' | 'zoom-in' | 'zoom-out' | 'fade-black'
export type ColorAdjustments = { brightness: number; contrast: number; saturation: number; hueRotate: number; temperature: number }
export type BrandColors = { accent: string | null; textColor: string | null; bgColor: string | null }
export type SubtitleConfig = { text: string; fontSize: number; fontFamily: string; color: string; bgOpacity: number; position: 'bottom' | 'top' | 'center' }
export const PLATFORMS: readonly Platform[] = ['instagram', 'tiktok', 'youtube']

export type LocalizedText = { en: string; ja: string }
export type PatternDecoration = 'letterbox' | 'vignette' | 'frame' | 'badge' | 'none' | 'grain' | 'scanlines' | 'polaroid' | 'tracking' | 'glow' | 'halftone' | 'blockframe' | 'duotone' | 'gridline' | 'slash' | 'shimmer' | 'stamp' | 'sparkle'
// How each pattern renders its title/CTA text, beyond just color - see the text-drawing block in
// App.tsx's drawFrame. 'default' is centered, bold, soft shadow (the original, only) look.
export type TextStyle = 'default' | 'minimal' | 'left' | 'upper' | 'glow' | 'outline' | 'elegant'
export type VideoPattern = { id: VideoPatternId; name: LocalizedText; description: LocalizedText; accent: string; copyDirection: LocalizedText; filter: string; decoration: PatternDecoration; textStyle: TextStyle }
// recommendedMaxSeconds is soft guidance only (shown as a hint, never enforced) - platforms revise
// their actual limits often enough that hard-coding one as a strict cap would go stale and could
// block a video that's perfectly valid. safeTop/safeBottom are fractions of height to keep clear of
// that platform's own UI chrome (captions, like/comment/share icons, etc.) when text is centered.
export type VideoFormat = { id: VideoFormatId; platform: Platform; name: LocalizedText; description: LocalizedText; width: number; height: number; safeTop: number; safeBottom: number; fileName: string; recommendedMaxSeconds: number }
export type VideoQuality = { id: VideoQualityId; name: LocalizedText; fps: number; bitsPerSecond: number; scale: number; description: LocalizedText }
export type PatternFrame = { scale: number; translateX: number; translateY: number; rotation: number; imageOpacity: number; textOpacity: number; textTranslateY: number; textScale: number; overlayOpacity: number; flashOpacity: number }

// Beyond motion speed, each pattern gets its own color grade (`filter`, valid as both a CSS and a
// Canvas2D filter string), a signature decoration, and a text treatment (`textStyle`) so every
// pattern reads as a distinct edit rather than the same pan/zoom with different numbers.
export const VIDEO_PATTERNS: readonly VideoPattern[] = [
  { id: 'cinematic', name: { en: 'Cinematic', ja: 'シネマティック' }, description: { en: 'Slow zoom + letterbox + deep fade', ja: 'ゆっくりズーム＋レターボックス＋深いフェード' }, accent: '#b9ff66', copyDirection: { en: 'Use cinematic, lingering language that conveys the scene and emotion quietly.', ja: '余韻のある映画的な言葉。情景と感情を静かに伝える' }, filter: 'contrast(1.1) saturate(.82) brightness(.95)', decoration: 'letterbox', textStyle: 'default' },
  { id: 'dynamic', name: { en: 'Dynamic', ja: 'ダイナミック' }, description: { en: 'Fast zoom + slide + flash cuts', ja: '速いズーム＋横スライド＋フラッシュカット' }, accent: '#ff725e', copyDirection: { en: 'Use short, powerful language with an energetic call to action.', ja: '短く力強い言葉。行動を促すテンポのよいコピー' }, filter: 'contrast(1.18) saturate(1.4) brightness(1.03)', decoration: 'none', textStyle: 'default' },
  { id: 'minimal', name: { en: 'Minimal', ja: 'ミニマル' }, description: { en: 'Quiet cuts + soft vignette', ja: '静かな切り替え＋柔らかいビネット' }, accent: '#f4f0e8', copyDirection: { en: 'Use concise, elegant language and leave visual breathing room.', ja: '簡潔で上品な言葉。情報を詰め込まず余白を残す' }, filter: 'contrast(.97) saturate(.88) brightness(1.04)', decoration: 'vignette', textStyle: 'minimal' },
  { id: 'album', name: { en: 'Photo album', ja: 'フォトアルバム' }, description: { en: 'Gentle pan + warm frame', ja: '柔らかなパン＋温かみのあるフレーム' }, accent: '#ffd6a5', copyDirection: { en: 'Use warm, relatable language that feels like sharing a memory.', ja: '思い出を語る温かい言葉。親しみや共感を大切にする' }, filter: 'sepia(.18) contrast(1.03) saturate(1.08)', decoration: 'frame', textStyle: 'left' },
  { id: 'social', name: { en: 'Social trend', ja: 'SNSトレンド' }, description: { en: 'Quick cuts + bold accent badge', ja: '短いカット＋ポップなアクセントバッジ' }, accent: '#75e6ff', copyDirection: { en: 'Open with a timely hook that naturally encourages saves and shares.', ja: '冒頭で惹きつける旬の表現。保存やシェアにつながるコピー' }, filter: 'contrast(1.22) saturate(1.55)', decoration: 'badge', textStyle: 'upper' },
  { id: 'noir', name: { en: 'Noir', ja: 'フィルムノワール' }, description: { en: 'Dramatic zoom + grayscale + film grain', ja: 'ドラマチックなズーム＋モノクロ＋フィルム粒子' }, accent: '#dcdcdc', copyDirection: { en: 'Use terse, dramatic language with an air of mystery.', ja: '簡潔で緊張感のある、ミステリアスな言葉を使う' }, filter: 'grayscale(1) contrast(1.35) brightness(.92)', decoration: 'grain', textStyle: 'default' },
  { id: 'neon', name: { en: 'Neon', ja: 'ネオン' }, description: { en: 'Pulsing zoom + scan lines + electric color', ja: '脈打つズーム＋走査線＋電飾カラー' }, accent: '#00f0ff', copyDirection: { en: 'Use bold, high-energy language with a nightlife edge.', ja: '大胆でハイテンションな、ナイトライフ感のある言葉を使う' }, filter: 'contrast(1.3) saturate(1.7) brightness(1.05) hue-rotate(-6deg)', decoration: 'scanlines', textStyle: 'glow' },
  { id: 'polaroid', name: { en: 'Polaroid', ja: 'ポラロイド' }, description: { en: 'Gentle drift + instant-photo border + faded tone', ja: '柔らかな漂うような動き＋ポラロイド風フレーム＋褪せた色調' }, accent: '#f5e6c8', copyDirection: { en: 'Use casual, personal language, like a caption scribbled by hand.', ja: '手書きのメモのような、カジュアルで個人的な言葉を使う' }, filter: 'sepia(.1) contrast(.93) saturate(.82) brightness(1.08)', decoration: 'polaroid', textStyle: 'default' },
  { id: 'vhs', name: { en: 'VHS', ja: 'VHS風' }, description: { en: 'Tracking glitch + warm retro tone + gentle drift', ja: 'トラッキングノイズ＋暖かみのあるレトロ色調＋緩やかな動き' }, accent: '#ff3d81', copyDirection: { en: 'Use nostalgic, retro-cool language, like an old home-video caption.', ja: '懐かしくてクールな、古いホームビデオのような言葉を使う' }, filter: 'contrast(1.15) saturate(1.25) brightness(1.02) sepia(.08)', decoration: 'tracking', textStyle: 'default' },
  { id: 'glow', name: { en: 'Glow', ja: 'グロウ' }, description: { en: 'Soft bloom + dreamy warmth + floaty zoom', ja: '柔らかい光の滲み＋夢見心地な暖かさ＋漂うようなズーム' }, accent: '#ffcfe8', copyDirection: { en: 'Use soft, dreamy, poetic language.', ja: '柔らかく夢見心地な、詩的な言葉を使う' }, filter: 'brightness(1.12) contrast(.92) saturate(1.15)', decoration: 'glow', textStyle: 'minimal' },
  { id: 'comic', name: { en: 'Comic', ja: 'コミック' }, description: { en: 'Halftone dots + bold pop color + punchy cuts', ja: 'ハーフトーンドット＋ポップな色調＋小気味よいカット' }, accent: '#ffe600', copyDirection: { en: 'Use punchy, exclamatory language like a comic panel caption.', ja: '漫画の吹き出しのような、勢いのある言葉を使う' }, filter: 'contrast(1.35) saturate(1.6) brightness(1.02)', decoration: 'halftone', textStyle: 'upper' },
  { id: 'editorial', name: { en: 'Editorial', ja: 'エディトリアル' }, description: { en: 'Bold color block + sharp contrast + confident pace', ja: '大胆なカラーブロック＋シャープなコントラスト＋自信のあるテンポ' }, accent: '#ff4d3d', copyDirection: { en: 'Use confident, declarative language like a magazine headline.', ja: '雑誌の見出しのような、自信に満ちた断定的な言葉を使う' }, filter: 'contrast(1.25) saturate(1.1) brightness(.98)', decoration: 'blockframe', textStyle: 'left' },
  { id: 'pastel', name: { en: 'Pastel', ja: 'パステル' }, description: { en: 'Soft color wash + floating drift + light title', ja: '柔らかな色調＋漂うような動き＋軽やかなタイトル' }, accent: '#e0a9ff', copyDirection: { en: 'Use sweet, gentle language, like a soft daydream.', ja: '甘く優しい、夢見心地な言葉を使う' }, filter: 'saturate(.75) brightness(1.08) contrast(.92) hue-rotate(4deg)', decoration: 'duotone', textStyle: 'minimal' },
  { id: 'retrowave', name: { en: 'Retrowave', ja: 'レトロウェイブ' }, description: { en: 'Neon horizon grid + magenta glow + rising zoom', ja: 'ネオンの地平線グリッド＋マゼンタの光＋上昇するズーム' }, accent: '#ff2fd1', copyDirection: { en: 'Use confident, retro-futuristic 80s language.', ja: '自信に満ちた、80年代風レトロフューチャーな言葉を使う' }, filter: 'contrast(1.25) saturate(1.5) brightness(.96) hue-rotate(-15deg)', decoration: 'gridline', textStyle: 'glow' },
  { id: 'street', name: { en: 'Street', ja: 'ストリート' }, description: { en: 'Spray-paint slash + bold outline title + punchy pop', ja: 'スプレーペイント風のライン＋太い縁取りタイトル＋小気味よいポップ' }, accent: '#ffcc00', copyDirection: { en: 'Use bold, brash, street-smart language.', ja: '大胆でストリート感のある、勢いのある言葉を使う' }, filter: 'contrast(1.4) saturate(1.35) brightness(.98)', decoration: 'slash', textStyle: 'outline' },
  { id: 'luxury', name: { en: 'Luxury', ja: 'ラグジュアリー' }, description: { en: 'Gold shimmer frame + refined, minimal motion', ja: 'ゴールドの光る枠＋上品で控えめな動き' }, accent: '#d4af37', copyDirection: { en: 'Use refined, confident, aspirational language.', ja: '上品で自信に満ちた、憧れを誘う言葉を使う' }, filter: 'contrast(1.08) saturate(.95) brightness(1.02) sepia(.05)', decoration: 'shimmer', textStyle: 'elegant' },
  { id: 'travel', name: { en: 'Travel', ja: 'トラベル' }, description: { en: 'Postcard stamp + dashed border + exploring pan', ja: 'ポストカード風スタンプ＋点線の枠＋探検するようなパン' }, accent: '#5aa9e6', copyDirection: { en: 'Use adventurous, wanderlust language.', ja: '冒険心をくすぐる、旅への憧れを誘う言葉を使う' }, filter: 'contrast(1.05) saturate(1.15) brightness(1.03)', decoration: 'stamp', textStyle: 'left' },
  { id: 'kawaii', name: { en: 'Kawaii', ja: 'カワイイ' }, description: { en: 'Candy color pop + sparkle + bouncy zoom', ja: 'キャンディカラー＋きらめき＋弾むようなズーム' }, accent: '#ff8fc7', copyDirection: { en: 'Use cute, playful, exclamatory language.', ja: 'かわいく元気な、勢いのある言葉を使う' }, filter: 'saturate(1.3) brightness(1.1) contrast(1.05)', decoration: 'sparkle', textStyle: 'upper' },
] as const

export const VIDEO_FORMATS: readonly VideoFormat[] = [
  { id: 'reel', platform: 'instagram', name: { en: 'Instagram Reel', ja: 'Instagramリール' }, description: { en: '9:16 vertical short video', ja: '9:16・縦型ショート' }, width: 1080, height: 1920, safeTop: .08, safeBottom: .18, fileName: 'instagram-reel', recommendedMaxSeconds: 90 },
  { id: 'story', platform: 'instagram', name: { en: 'Instagram Story', ja: 'Instagramストーリー' }, description: { en: '9:16 with top and bottom UI safe areas', ja: '9:16・上下UI安全領域' }, width: 1080, height: 1920, safeTop: .14, safeBottom: .2, fileName: 'instagram-story', recommendedMaxSeconds: 60 },
  { id: 'feed-portrait', platform: 'instagram', name: { en: 'Portrait feed', ja: 'フィード縦型' }, description: { en: '4:5 Instagram post', ja: '4:5・Instagram投稿' }, width: 1080, height: 1350, safeTop: .06, safeBottom: .1, fileName: 'feed-portrait', recommendedMaxSeconds: 60 },
  { id: 'square', platform: 'instagram', name: { en: 'Square feed', ja: 'フィード正方形' }, description: { en: '1:1 social post', ja: '1:1・汎用SNS投稿' }, width: 1080, height: 1080, safeTop: .06, safeBottom: .1, fileName: 'feed-square', recommendedMaxSeconds: 60 },
  { id: 'feed-landscape', platform: 'instagram', name: { en: 'Landscape feed', ja: 'フィード横型' }, description: { en: '1.91:1 wide Instagram post', ja: '1.91:1・横長のInstagram投稿' }, width: 1080, height: 565, safeTop: .06, safeBottom: .1, fileName: 'feed-landscape', recommendedMaxSeconds: 60 },
  { id: 'tiktok', platform: 'tiktok', name: { en: 'TikTok', ja: 'TikTok' }, description: { en: '9:16 with TikTok UI safe areas', ja: '9:16・TikTokのUIを考慮' }, width: 1080, height: 1920, safeTop: .08, safeBottom: .22, fileName: 'tiktok', recommendedMaxSeconds: 60 },
  { id: 'tiktok-square', platform: 'tiktok', name: { en: 'TikTok Square', ja: 'TikTokスクエア' }, description: { en: '1:1, e.g. for repurposing feed content', ja: '1:1・フィード用素材の転用などに' }, width: 1080, height: 1080, safeTop: .06, safeBottom: .1, fileName: 'tiktok-square', recommendedMaxSeconds: 60 },
  { id: 'shorts', platform: 'youtube', name: { en: 'YouTube Shorts', ja: 'YouTube Shorts' }, description: { en: '9:16 with right-side UI allowance', ja: '9:16・右側UIを考慮' }, width: 1080, height: 1920, safeTop: .08, safeBottom: .16, fileName: 'youtube-shorts', recommendedMaxSeconds: 60 },
  { id: 'youtube-video', platform: 'youtube', name: { en: 'YouTube video', ja: 'YouTube動画' }, description: { en: '16:9 standard landscape upload', ja: '16:9・横型の通常動画' }, width: 1920, height: 1080, safeTop: .05, safeBottom: .08, fileName: 'youtube-video', recommendedMaxSeconds: 600 },
  { id: 'youtube-square', platform: 'youtube', name: { en: 'YouTube Square', ja: 'YouTubeスクエア' }, description: { en: '1:1 upload, plays large on mobile feeds', ja: '1:1投稿・モバイルフィードで大きく表示' }, width: 1080, height: 1080, safeTop: .05, safeBottom: .08, fileName: 'youtube-square', recommendedMaxSeconds: 600 },
] as const

export const VIDEO_QUALITIES: readonly VideoQuality[] = [
  { id: 'standard', name: { en: 'Standard', ja: '標準' }, fps: 30, bitsPerSecond: 20_000_000, scale: 1, description: { en: '1080p · balanced file size', ja: '1080p・標準ファイルサイズ' } },
  { id: 'high', name: { en: 'High quality', ja: '高画質' }, fps: 60, bitsPerSecond: 50_000_000, scale: 1, description: { en: '1080p · 60fps · high bitrate', ja: '1080p・60fps・高ビットレート' } },
  { id: 'ultra', name: { en: 'Ultra HD', ja: '最高画質' }, fps: 60, bitsPerSecond: 100_000_000, scale: 2, description: { en: '4K (2160p) · 60fps · maximum bitrate', ja: '4K（2160p）・60fps・最大ビットレート' } },
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
  if (pattern === 'vhs') { const jitter = Math.sin(p * Math.PI * 20) * .15; return { scale: 1.03 + p * .03, translateX: jitter, translateY: 0, rotation: 0, imageOpacity: Math.max(.2, enterExit(p, .15)), textOpacity: enterExit(p, .17), textTranslateY: (1 - easeOut(p)) * 16, textScale: 1, overlayOpacity: .76, flashOpacity: 0 } }
  if (pattern === 'glow') return { scale: 1.02 + p * .05, translateX: 0, translateY: (index % 2 === 0 ? -1 : 1) * (1 - p) * 3, rotation: 0, imageOpacity: Math.max(.25, enterExit(p, .26)), textOpacity: enterExit(p, .3), textTranslateY: (1 - easeOut(p)) * 12, textScale: 1, overlayOpacity: .64, flashOpacity: 0 }
  if (pattern === 'comic') return { scale: 1.04 + p * .03, translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 5, translateY: 0, rotation: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 1.2, imageOpacity: Math.max(.2, enterExit(p, .07)), textOpacity: enterExit(p, .08), textTranslateY: (1 - easeOut(p)) * -18, textScale: pop(p), overlayOpacity: .7, flashOpacity: 0 }
  if (pattern === 'editorial') return { scale: 1.03 + p * .035, translateX: (1 - easeOut(p)) * -5, translateY: 0, rotation: 0, imageOpacity: Math.max(.18, enterExit(p, .18)), textOpacity: enterExit(p, .2), textTranslateY: (1 - easeOut(p)) * 16, textScale: 1, overlayOpacity: .8, flashOpacity: 0 }
  if (pattern === 'pastel') { const bob = Math.sin(p * Math.PI * 2) * 2.5; return { scale: 1.03 + p * .025, translateX: 0, translateY: bob, rotation: 0, imageOpacity: Math.max(.3, enterExit(p, .26)), textOpacity: enterExit(p, .28), textTranslateY: (1 - easeOut(p)) * 12, textScale: 1, overlayOpacity: .6, flashOpacity: 0 } }
  if (pattern === 'retrowave') return { scale: 1.04 + easeOut(p) * .09, translateX: 0, translateY: (1 - easeOut(p)) * 6, rotation: 0, imageOpacity: Math.max(.2, enterExit(p, .12)), textOpacity: enterExit(p, .14), textTranslateY: (1 - easeOut(p)) * -22, textScale: pop(p), overlayOpacity: .74, flashOpacity: 0 }
  if (pattern === 'street') { const jump = p < .12 ? 1 + Math.sin(clamp(p / .12) * Math.PI) * .16 : 1; return { scale: 1.06 * jump, translateX: (index % 2 === 0 ? 1 : -1) * (1 - easeOut(p)) * 7, translateY: 0, rotation: (index % 2 === 0 ? -1 : 1) * (1 - easeOut(p)) * 2.2, imageOpacity: Math.max(.2, enterExit(p, .06)), textOpacity: enterExit(p, .07), textTranslateY: (1 - easeOut(p)) * -20, textScale: pop(p), overlayOpacity: .72, flashOpacity: 0 } }
  if (pattern === 'luxury') return { scale: 1.01 + p * .02, translateX: 0, translateY: 0, rotation: 0, imageOpacity: Math.max(.4, enterExit(p, .3)), textOpacity: enterExit(p, .34), textTranslateY: (1 - easeOut(p)) * 8, textScale: 1, overlayOpacity: .66, flashOpacity: 0 }
  if (pattern === 'travel') return { scale: 1.07, translateX: (index % 2 === 0 ? -1 : 1) * (7 - p * 14), translateY: (index % 3 - 1) * (1.5 - p * 3), rotation: 0, imageOpacity: Math.max(.2, enterExit(p, .2)), textOpacity: enterExit(p, .22), textTranslateY: (1 - easeOut(p)) * 16, textScale: 1, overlayOpacity: .72, flashOpacity: 0 }
  if (pattern === 'kawaii') { const bounce = Math.abs(Math.sin(p * Math.PI * 3)) * Math.max(0, 1 - p * .7) * .035; return { scale: 1.05 + bounce, translateX: 0, translateY: -bounce * 60, rotation: Math.sin(p * Math.PI * 3) * (1 - p) * 1.5, imageOpacity: Math.max(.22, enterExit(p, .07)), textOpacity: enterExit(p, .08), textTranslateY: (1 - easeOut(p)) * -18, textScale: pop(p), overlayOpacity: .66, flashOpacity: 0 } }
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

export function getFrameStateWithDurations(time: number, durations: readonly number[]): FrameState {
  if (durations.length === 0) return { index: 0, progress: 0 }
  let accumulated = 0
  for (let i = 0; i < durations.length; i++) {
    const dur = Math.max(0.1, durations[i])
    if (time < accumulated + dur || i === durations.length - 1) {
      const localTime = Math.max(0, Math.min(time - accumulated, dur))
      return { index: i, progress: dur > 0 ? localTime / dur : 0 }
    }
    accumulated += dur
  }
  return { index: durations.length - 1, progress: 1 }
}

export function totalDurationWithDurations(durations: readonly number[]): number {
  return durations.reduce((sum, d) => sum + Math.max(0.1, d), 0)
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

// A project-wide logo/watermark overlay (upload once, applies to every slide) - see the
// `watermark` state in App.tsx and drawWatermark, which calls this to know where to place it. A
// pure function so the corner-placement math is unit-testable without a real canvas/image.
export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type WatermarkRect = { x: number; y: number; width: number; height: number }
export function watermarkRect(position: WatermarkPosition, frameWidth: number, frameHeight: number, imageAspectRatio: number, scale: number): WatermarkRect {
  const margin = frameWidth * .04
  const width = frameWidth * clamp(scale, .05, .6)
  const height = imageAspectRatio > 0 ? width / imageAspectRatio : width
  const x = position.endsWith('right') ? frameWidth - margin - width : margin
  const y = position.startsWith('bottom') ? frameHeight - margin - height : margin
  return { x, y, width, height }
}
export function nextFrameDelayMs(start: number, frameIndex: number, fps: number, now: number): number { return Math.max(0, start + (frameIndex * 1000) / fps - now) }

export const TRANSITION_TYPES: readonly { id: TransitionType; name: LocalizedText }[] = [
  { id: 'cut', name: { en: 'Cut', ja: 'カット' } },
  { id: 'dissolve', name: { en: 'Dissolve', ja: 'ディゾルブ' } },
  { id: 'slide-left', name: { en: 'Slide left', ja: '左スライド' } },
  { id: 'slide-right', name: { en: 'Slide right', ja: '右スライド' } },
  { id: 'slide-up', name: { en: 'Slide up', ja: '上スライド' } },
  { id: 'slide-down', name: { en: 'Slide down', ja: '下スライド' } },
  { id: 'wipe-left', name: { en: 'Wipe left', ja: '左ワイプ' } },
  { id: 'wipe-right', name: { en: 'Wipe right', ja: '右ワイプ' } },
  { id: 'zoom-in', name: { en: 'Zoom in', ja: 'ズームイン' } },
  { id: 'zoom-out', name: { en: 'Zoom out', ja: 'ズームアウト' } },
  { id: 'fade-black', name: { en: 'Fade to black', ja: 'ブラックフェード' } },
] as const

export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = { brightness: 1, contrast: 1, saturation: 1, hueRotate: 0, temperature: 0 }
export const DEFAULT_BRAND_COLORS: BrandColors = { accent: null, textColor: null, bgColor: null }

export function buildColorFilter(adj: ColorAdjustments): string {
  const parts: string[] = []
  if (adj.brightness !== 1) parts.push(`brightness(${adj.brightness.toFixed(2)})`)
  if (adj.contrast !== 1) parts.push(`contrast(${adj.contrast.toFixed(2)})`)
  if (adj.saturation !== 1) parts.push(`saturate(${adj.saturation.toFixed(2)})`)
  if (adj.hueRotate !== 0) parts.push(`hue-rotate(${adj.hueRotate}deg)`)
  if (adj.temperature !== 0) {
    const warmth = adj.temperature > 0 ? `sepia(${(adj.temperature * 0.3).toFixed(2)})` : `hue-rotate(${(adj.temperature * 0.5).toFixed(0)}deg)`
    parts.push(warmth)
  }
  return parts.join(' ') || 'none'
}

export const GOOGLE_FONTS = [
  { family: 'Noto Sans JP', weights: '400;500;700' },
  { family: 'DM Sans', weights: '400;500;600;700' },
  { family: 'Inter', weights: '400;500;600;700' },
  { family: 'Poppins', weights: '400;500;600;700' },
  { family: 'Playfair Display', weights: '400;500;600;700' },
  { family: 'Bebas Neue', weights: '400' },
  { family: 'Oswald', weights: '400;500;600;700' },
  { family: 'Raleway', weights: '400;500;600;700' },
  { family: 'Montserrat', weights: '400;500;600;700' },
  { family: 'Lora', weights: '400;500;600;700' },
  { family: 'Crimson Text', weights: '400;600;700' },
  { family: 'Space Grotesk', weights: '400;500;600;700' },
  { family: 'Bitter', weights: '400;500;600;700' },
  { family: 'Rubik', weights: '400;500;600;700' },
  { family: 'Cabin', weights: '400;500;600;700' },
] as const

export const FONT_FAMILY_OPTIONS = GOOGLE_FONTS.map(f => f.family)

let fontsLoaded = false
export function loadGoogleFonts() {
  if (fontsLoaded) return
  fontsLoaded = true
  const families = GOOGLE_FONTS.map(f => `family=${f.family.replace(/ /g, '+')}:wght@${f.weights}`).join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}
