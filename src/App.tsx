import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { discoverLocalOllama, generateAiCaption, generateAiCopy, generateAiFocalPoint, generateAiStyle, initialOllamaUrl, isHeicFile, listOllamaModels, RECOMMENDED_VISION_MODELS, selectVisionModel, supportsVision } from './ai'
import type { AiCaption, AiCopy, AiProviderId, OllamaModel } from './ai'
import { chromeAiAvailabilityMessage, generateChromeAiCaption, generateChromeAiCopy, generateChromeAiFocalPoint, generateChromeAiStyle, prepareChromeAi } from './chrome-ai'
import type { ChromeAiAvailability } from './chrome-ai'
import { analyzeAutoEnhance, normalizeImageFile } from './image'
import { getInitialLanguage, translate } from './i18n'
import type { Language } from './i18n'
import { PLATFORMS, VIDEO_FORMATS, VIDEO_PATTERNS, VIDEO_QUALITIES, TRANSITION_TYPES, GOOGLE_FONTS, FONT_FAMILY_OPTIONS, DEFAULT_COLOR_ADJUSTMENTS, DEFAULT_BRAND_COLORS, buildColorFilter, loadGoogleFonts, getFrameState, getFrameStateWithDurations, totalDurationWithDurations, getPatternFrame, getVideoFormat, getVideoPattern, getVideoQuality, isVideoFormatId, isVideoPatternId, isVideoQualityId, maxSecondsPerImage, minSecondsPerImage, moveItem, watermarkRect, PURPOSES, MEDIA_TYPES } from './reel'
import type { PatternFrame, Platform, VideoFormatId, VideoPattern, VideoPatternId, VideoQualityId, WatermarkPosition, TransitionType, ColorAdjustments, BrandColors, SubtitleConfig } from './reel'
import { decodeAudioFile, fitAudioBuffer } from './audio'
import { audioBufferToWavBlob, generateMusicFile, MUSIC_MOODS, synthesizeMusic } from './generated-music'
import type { MusicMoodId } from './generated-music'
import { pickAudioCodec, pickVideoCodec, renderMp4, renderWebm } from './video-export'
import { editGeminiImage, fetchServerConfig, generateGeminiImage } from './gemini'
import type { ServerConfig } from './gemini'

type TextPosition = 'upper' | 'center' | 'lower'
// patternOverride lets a single photo use a different motion/color style than the project's
// default (null = follow the project's global pattern selected below). Applies consistently
// everywhere that slide is rendered - live preview, video export, and still-image export - since
// each slide's motion is already computed from its own local progress within its own display
// window, nothing stops one slide from playing back with a different pattern than its neighbors.
// original holds the pre-AI-edit version of {blob, url, image} whenever a Gemini edit has been
// applied (see editSlideWithGemini) - null otherwise. Keeps an AI edit from being a one-way,
// unrecoverable change: "Revert to original" just swaps these back.
type Slide = { id: string; name: string; url: string; image: HTMLImageElement; blob: Blob; title: string; cta: string; showText: boolean; textPosition: TextPosition; autoEnhanceFilter: string; autoEnhance: boolean; focalX: number; focalY: number; patternOverride: VideoPatternId | null; original: { blob: Blob; url: string; image: HTMLImageElement } | null; duration: number | null; fontFamily: string | null; colorAdjustments: ColorAdjustments | null; transition: TransitionType | null; subtitle: SubtitleConfig | null }
// focalX/focalY (0-1) pick which part of the cropped-to-cover image sits at the frame's center,
// defaulting to .5/.5 (today's always-centered behavior). Clamped so the crop window never reveals
// empty space beyond the image's edges.
function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, scale = 1, focalX = .5, focalY = .5) { const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale; const w = image.naturalWidth * ratio; const h = image.naturalHeight * ratio; const x = Math.min(0, Math.max(width - w, width / 2 - focalX * w)); const y = Math.min(0, Math.max(height - h, height / 2 - focalY * h)); ctx.drawImage(image, x, y, w, h) }
function patternTransform(frame: PatternFrame) { return `translate(${frame.translateX}%, ${frame.translateY}%) rotate(${frame.rotation}deg) scale(${frame.scale})` }
const platformLabelKey = (platform: Platform): 'platformInstagram' | 'platformTiktok' | 'platformYoutube' => platform === 'instagram' ? 'platformInstagram' : platform === 'tiktok' ? 'platformTiktok' : 'platformYoutube'
const WATERMARK_POSITIONS: readonly WatermarkPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const watermarkPositionLabelKey = (position: WatermarkPosition): 'positionTopLeft' | 'positionTopRight' | 'positionBottomLeft' | 'positionBottomRight' => position === 'top-left' ? 'positionTopLeft' : position === 'top-right' ? 'positionTopRight' : position === 'bottom-left' ? 'positionBottomLeft' : 'positionBottomRight'
// Lazily built once per canvas resolution and reused: a small tileable noise swatch for the
// 'noir' grain decoration. Regenerating random pixels every frame would cost more than it's worth
// for a texture that only needs to read as "grainy", not animate.
let grainPattern: { key: string; pattern: CanvasPattern } | null = null
function getGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern {
  const key = `${ctx.canvas.width}x${ctx.canvas.height}`
  if (grainPattern?.key === key) return grainPattern.pattern
  const tile = document.createElement('canvas'); tile.width = 96; tile.height = 96
  const tileCtx = tile.getContext('2d')!; const imageData = tileCtx.createImageData(96, 96)
  for (let i = 0; i < imageData.data.length; i += 4) { const v = Math.random() * 255; imageData.data[i] = v; imageData.data[i + 1] = v; imageData.data[i + 2] = v; imageData.data[i + 3] = 255 }
  tileCtx.putImageData(imageData, 0, 0)
  const pattern = ctx.createPattern(tile, 'repeat')!
  grainPattern = { key, pattern }
  return pattern
}
// Same lazy-tile trick as the grain pattern above, for the 'comic' halftone dot overlay.
let halftonePattern: { key: string; pattern: CanvasPattern } | null = null
function getHalftonePattern(ctx: CanvasRenderingContext2D): CanvasPattern {
  const key = `${ctx.canvas.width}`
  if (halftonePattern?.key === key) return halftonePattern.pattern
  const size = Math.max(10, Math.round(ctx.canvas.width * .014)); const tile = document.createElement('canvas'); tile.width = size; tile.height = size
  const tileCtx = tile.getContext('2d')!; tileCtx.fillStyle = '#000'; tileCtx.beginPath(); tileCtx.arc(size / 2, size / 2, size * .3, 0, Math.PI * 2); tileCtx.fill()
  const pattern = ctx.createPattern(tile, 'repeat')!
  halftonePattern = { key, pattern }
  return pattern
}
// Each pattern's signature decoration, so the looks read as distinct edits rather than the same
// pan/zoom with different numbers. Mirrored in the live preview via CSS (see styles.css).
function decorate(ctx: CanvasRenderingContext2D, pattern: VideoPattern, frame: PatternFrame, width: number, height: number, progress: number) {
  if (pattern.decoration === 'letterbox') { const bar = height * .045; ctx.fillStyle = '#050408'; ctx.fillRect(0, 0, width, bar); ctx.fillRect(0, height - bar, width, bar) }
  if (pattern.decoration === 'vignette' || pattern.decoration === 'frame') { const radial = ctx.createRadialGradient(width / 2, height * .45, height * .26, width / 2, height * .45, height * .72); radial.addColorStop(0, 'rgba(0,0,0,0)'); radial.addColorStop(1, pattern.decoration === 'frame' ? 'rgba(43,24,10,.55)' : 'rgba(0,0,0,.5)'); ctx.fillStyle = radial; ctx.fillRect(0, 0, width, height) }
  if (pattern.decoration === 'badge') { ctx.save(); ctx.translate(width * .88, height * .16); ctx.scale(frame.textScale, frame.textScale); ctx.fillStyle = pattern.accent; ctx.beginPath(); ctx.arc(0, 0, width * .045, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0d0c12'; ctx.font = `700 ${Math.round(width * .05)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', 0, 0); ctx.restore() }
  if (pattern.decoration === 'grain') { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .16; ctx.fillStyle = getGrainPattern(ctx); ctx.fillRect(0, 0, width, height); ctx.restore() }
  if (pattern.decoration === 'scanlines') { ctx.save(); ctx.globalAlpha = .14; ctx.fillStyle = '#000'; const step = Math.max(3, height * .012); for (let y = 0; y < height; y += step) ctx.fillRect(0, y, width, step * .35); ctx.restore() }
  if (pattern.decoration === 'polaroid') { ctx.save(); ctx.fillStyle = '#f7f3ea'; const border = width * .045; const bottom = height * .12; ctx.fillRect(0, 0, width, border); ctx.fillRect(0, 0, border, height); ctx.fillRect(width - border, 0, border, height); ctx.fillRect(0, height - bottom, width, bottom); ctx.restore() }
  if (pattern.decoration === 'tracking') { const y = height * (.12 + .68 * (((progress * 3) % 1 + 1) % 1)); ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#fff'; ctx.fillRect(0, y, width, height * .025); ctx.restore() }
  if (pattern.decoration === 'glow') { const radial = ctx.createRadialGradient(width / 2, height * .4, 0, width / 2, height * .4, height * .55); radial.addColorStop(0, 'rgba(255,232,205,.28)'); radial.addColorStop(1, 'rgba(255,232,205,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radial; ctx.fillRect(0, 0, width, height); ctx.restore() }
  if (pattern.decoration === 'halftone') { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .12; ctx.fillStyle = getHalftonePattern(ctx); ctx.fillRect(0, 0, width, height); ctx.restore() }
  if (pattern.decoration === 'blockframe') { ctx.save(); ctx.fillStyle = pattern.accent; ctx.fillRect(0, 0, width * .022, height); ctx.restore() }
  if (pattern.decoration === 'duotone') { const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, 'rgba(224,169,255,.38)'); gradient.addColorStop(1, 'rgba(255,214,235,.38)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height); ctx.restore() }
  // Drawn before the bottom scrim gradient (like every decoration here), which would otherwise
  // nearly erase a plain thin line since the grid lives entirely in the bottom 38% where the scrim
  // is darkest - a glowing neon-sign treatment (bright core + soft shadowBlur) survives it instead.
  if (pattern.decoration === 'gridline') { ctx.save(); ctx.shadowColor = pattern.accent; ctx.shadowBlur = width * .02; ctx.strokeStyle = pattern.accent; ctx.globalAlpha = .85; ctx.lineWidth = Math.max(2, width * .0035); const horizon = height * .62; for (let i = 1; i <= 7; i++) { const y = horizon + (height - horizon) * (i / 7) ** 1.6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() } ctx.restore() }
  if (pattern.decoration === 'slash') { ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = pattern.accent; ctx.lineWidth = width * .018; for (const x of [width * .12, width * .28]) { ctx.beginPath(); ctx.moveTo(x, -height * .05); ctx.lineTo(x + width * .1, height * .22); ctx.stroke() } ctx.restore() }
  if (pattern.decoration === 'shimmer') { ctx.save(); const border = Math.max(2, width * .006); ctx.strokeStyle = pattern.accent; ctx.globalAlpha = .8; ctx.lineWidth = border; ctx.strokeRect(border, border, width - border * 2, height - border * 2); ctx.restore() }
  if (pattern.decoration === 'stamp') { ctx.save(); const border = Math.max(2, width * .006); const inset = width * .045; ctx.strokeStyle = '#f4f0e8'; ctx.globalAlpha = .6; ctx.lineWidth = border; ctx.setLineDash([width * .012, width * .01]); ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2); ctx.setLineDash([]); ctx.globalAlpha = .85; ctx.translate(width - inset - width * .09, inset + width * .09); ctx.rotate(-.2); ctx.strokeRect(-width * .06, -width * .06, width * .12, width * .12); ctx.restore() }
  if (pattern.decoration === 'sparkle') { ctx.save(); ctx.fillStyle = pattern.accent; const spots = [[.16, .18], [.82, .14], [.24, .78], [.78, .7], [.5, .1]]; for (const [sx, sy] of spots) { const cx = width * sx; const cy = height * sy; const r = width * .012; ctx.beginPath(); ctx.moveTo(cx, cy - r * 2); ctx.lineTo(cx + r * .5, cy - r * .5); ctx.lineTo(cx + r * 2, cy); ctx.lineTo(cx + r * .5, cy + r * .5); ctx.lineTo(cx, cy + r * 2); ctx.lineTo(cx - r * .5, cy + r * .5); ctx.lineTo(cx - r * 2, cy); ctx.lineTo(cx - r * .5, cy - r * .5); ctx.closePath(); ctx.fill() } ctx.restore() }
}
// Beyond color, each text style changes alignment, weight/size, and shadow treatment so a
// pattern's title/CTA reads as part of its identity instead of the same lettering everywhere.
// 'outline' (street/graffiti) strokes a dark border around the fill instead of a soft shadow;
// 'elegant' (luxury) adds letter-spacing for a more refined mark - both restored automatically by
// the ctx.save()/restore() around every call site, so neither needs to reset itself afterward.
function drawSlideText(ctx: CanvasRenderingContext2D & { letterSpacing?: string }, pattern: VideoPattern, title: string, cta: string, width: number, height: number, fontFamily: string = 'Noto Sans JP', brandColors: BrandColors = DEFAULT_BRAND_COLORS) {
  const style = pattern.textStyle
  const align = style === 'left' ? 'left' : 'center'; const originX = align === 'left' ? -width * .38 : 0
  ctx.textAlign = align
  const displayTitle = (style === 'upper' || style === 'outline') ? (title || 'My story').toUpperCase() : (title || 'My story')
  const titleSize = style === 'minimal' ? width * .058 : style === 'elegant' ? width * .066 : width * .073
  const titleWeight = style === 'minimal' ? 500 : style === 'elegant' ? 600 : 700
  if (style === 'upper') { ctx.shadowColor = '#0b0910'; ctx.shadowBlur = 0; ctx.shadowOffsetX = width * .007; ctx.shadowOffsetY = width * .007 }
  else if (style === 'glow') { ctx.shadowColor = brandColors.accent || pattern.accent; ctx.shadowBlur = width * .05 }
  else if (style === 'outline') { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0 }
  else if (style === 'elegant') { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = width * .012; ctx.letterSpacing = `${Math.round(width * .012)}px` }
  else { ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = width * .018 }
  ctx.font = `${titleWeight} ${Math.round(titleSize)}px '${fontFamily}', system-ui, sans-serif`
  if (style === 'outline') { ctx.lineJoin = 'round'; ctx.lineWidth = width * .014; ctx.strokeStyle = '#0d0c12'; ctx.strokeText(displayTitle, originX, 0, width * .82) }
  ctx.fillStyle = brandColors.textColor || '#fff'
  ctx.fillText(displayTitle, originX, 0, width * .82)
  if (cta) {
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
    const displayCta = (style === 'upper' || style === 'outline') ? cta.toUpperCase() : cta
    ctx.font = `600 ${Math.round(width * .03)}px '${fontFamily}', system-ui, sans-serif`
    if (style === 'outline') { ctx.lineWidth = width * .008; ctx.strokeStyle = '#0d0c12'; ctx.strokeText(displayCta, originX, height * .07, width * .72) }
    ctx.fillStyle = brandColors.accent || pattern.accent
    ctx.fillText(displayCta, originX, height * .07, width * .72)
  }
}
// A project-wide logo/watermark, drawn last (on top of decoration and text) in a fixed corner so
// it reads as a consistent brand mark rather than something that could get buried under a
// pattern's own decoration. null when no watermark image has been uploaded.
type WatermarkConfig = { image: HTMLImageElement; position: WatermarkPosition; opacity: number; scale: number }
function drawWatermark(ctx: CanvasRenderingContext2D, watermark: WatermarkConfig | null, width: number, height: number) {
  if (!watermark) return
  const ratio = watermark.image.naturalWidth / (watermark.image.naturalHeight || 1)
  const rect = watermarkRect(watermark.position, width, height, ratio, watermark.scale)
  ctx.save(); ctx.globalAlpha = watermark.opacity; ctx.drawImage(watermark.image, rect.x, rect.y, rect.width, rect.height); ctx.restore()
}
function drawSubtitle(ctx: CanvasRenderingContext2D, config: SubtitleConfig, width: number, height: number) {
  if (!config.text) return
  const fontSize = Math.round(width * (config.fontSize / 100))
  const fontFamily = `'${config.fontFamily}', system-ui, sans-serif`
  const lines = config.text.split('\n')
  const lineHeight = fontSize * 1.4
  const totalHeight = lines.length * lineHeight
  const padding = fontSize * 0.5
  const maxWidth = width * 0.85
  let baseY = config.position === 'top' ? height * 0.08 : config.position === 'center' ? (height - totalHeight) / 2 : height * 0.88 - totalHeight
  ctx.save()
  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let i = 0; i < lines.length; i++) {
    const y = baseY + i * lineHeight
    const textWidth = ctx.measureText(lines[i]).width
    const bgX = (width - textWidth) / 2 - padding
    const bgW = textWidth + padding * 2
    if (config.bgOpacity > 0) {
      ctx.fillStyle = `rgba(0,0,0,${config.bgOpacity})`
      ctx.beginPath()
      const r = fontSize * 0.2
      ctx.roundRect(bgX, y - padding * 0.5, bgW, lineHeight, r)
      ctx.fill()
    }
    ctx.fillStyle = '#000'
    ctx.fillText(lines[i], width / 2 + 1, y + 1)
    ctx.fillStyle = config.color
    ctx.fillText(lines[i], width / 2, y)
  }
  ctx.restore()
}
function drawFrame(ctx: CanvasRenderingContext2D, slide: Slide, progress: number, title: string, cta: string, patternId: VideoPatternId, formatId: VideoFormatId, index: number, durationSeconds: number, watermark: WatermarkConfig | null, globalFont: string, globalColorAdj: ColorAdjustments, brandColors: BrandColors, subtitleConfig: SubtitleConfig | null) {
  const { width, height } = ctx.canvas; const frame = getPatternFrame(patternId, progress, index, durationSeconds); const pattern = getVideoPattern(patternId); const format = getVideoFormat(formatId)
  const bgColor = brandColors.bgColor || '#09080d'
  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height)
  const slideColorAdj = slide.colorAdjustments || globalColorAdj
  const combinedFilter = [slide.autoEnhance ? `${pattern.filter} ${slide.autoEnhanceFilter}` : pattern.filter, buildColorFilter(slideColorAdj)].filter(f => f && f !== 'none').join(' ')
  ctx.save(); ctx.globalAlpha = frame.imageOpacity; ctx.filter = combinedFilter; ctx.translate(width / 2 + width * frame.translateX / 100, height / 2 + height * frame.translateY / 100); ctx.rotate(frame.rotation * Math.PI / 180); ctx.translate(-width / 2, -height / 2); cover(ctx, slide.image, width, height, frame.scale, slide.focalX, slide.focalY); ctx.restore()
  decorate(ctx, pattern, frame, width, height, progress)
  const gradient = ctx.createLinearGradient(0, height * .36, 0, height); gradient.addColorStop(0, 'rgba(8,7,13,0)'); gradient.addColorStop(1, `rgba(8,7,13,${frame.overlayOpacity})`); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height)
  if (frame.flashOpacity > 0) { ctx.save(); ctx.globalAlpha = frame.flashOpacity; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); ctx.restore() }
  if (slide.showText) { const positionRatio = slide.textPosition === 'upper' ? format.safeTop + .18 : slide.textPosition === 'center' ? .54 : 1 - format.safeBottom - .06; ctx.save(); ctx.globalAlpha = frame.textOpacity; const baseline = height * positionRatio; ctx.translate(width / 2, baseline + frame.textTranslateY * height / 430); ctx.scale(frame.textScale, frame.textScale); drawSlideText(ctx, pattern, title, cta, width, height, slide.fontFamily || globalFont, brandColors); ctx.restore() }
  if (subtitleConfig?.text) { drawSubtitle(ctx, subtitleConfig, width, height) }
  drawWatermark(ctx, watermark, width, height)
}
// A clean, fully-opaque single frame for static image / carousel export - the pattern's color
// grade and decoration still apply (so a static post still matches the chosen look), but without
// any of the fade-in/out, flash, or zoom-in-progress that only make sense mid-video.
function drawStaticFrame(ctx: CanvasRenderingContext2D, slide: Slide, title: string, cta: string, patternId: VideoPatternId, formatId: VideoFormatId, index: number, watermark: WatermarkConfig | null, globalFont: string, globalColorAdj: ColorAdjustments, brandColors: BrandColors, subtitleConfig: SubtitleConfig | null) {
  const { width, height } = ctx.canvas; const frame = getPatternFrame(patternId, .5, index); const pattern = getVideoPattern(patternId); const format = getVideoFormat(formatId)
  const bgColor = brandColors.bgColor || '#09080d'
  const slideColorAdj = slide.colorAdjustments || globalColorAdj
  const combinedFilter = [slide.autoEnhance ? `${pattern.filter} ${slide.autoEnhanceFilter}` : pattern.filter, buildColorFilter(slideColorAdj)].filter(f => f && f !== 'none').join(' ')
  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height); ctx.save(); ctx.filter = combinedFilter; cover(ctx, slide.image, width, height, 1, slide.focalX, slide.focalY); ctx.restore()
  decorate(ctx, pattern, frame, width, height, .5)
  const gradient = ctx.createLinearGradient(0, height * .36, 0, height); gradient.addColorStop(0, 'rgba(8,7,13,0)'); gradient.addColorStop(1, `rgba(8,7,13,${frame.overlayOpacity})`); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height)
  if (slide.showText) { const positionRatio = slide.textPosition === 'upper' ? format.safeTop + .18 : slide.textPosition === 'center' ? .54 : 1 - format.safeBottom - .06; ctx.save(); const baseline = height * positionRatio; ctx.translate(width / 2, baseline); drawSlideText(ctx, pattern, title, cta, width, height, slide.fontFamily || globalFont, brandColors); ctx.restore() }
  if (subtitleConfig?.text) { drawSubtitle(ctx, subtitleConfig, width, height) }
  drawWatermark(ctx, watermark, width, height)
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage(localStorage.getItem('language'))); const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const [slides, setSlides] = useState<Slide[]>([]); const [title, setTitle] = useState(() => translate(getInitialLanguage(localStorage.getItem('language')), 'defaultTitleValue')); const [cta, setCta] = useState(() => translate(getInitialLanguage(localStorage.getItem('language')), 'defaultCtaValue')); const [seconds, setSeconds] = useState(3)
  const [patternId, setPatternId] = useState<VideoPatternId>(() => isVideoPatternId(localStorage.getItem('videoPattern')) ? localStorage.getItem('videoPattern') as VideoPatternId : 'cinematic')
const [formatId, setFormatId] = useState<VideoFormatId>(() => isVideoFormatId(localStorage.getItem('videoFormat')) ? localStorage.getItem('videoFormat') as VideoFormatId : 'reel')
const [qualityId, setQualityId] = useState<VideoQualityId>(() => isVideoQualityId(localStorage.getItem('videoQuality')) ? localStorage.getItem('videoQuality') as VideoQualityId : 'high')
const [purposeId, setPurposeId] = useState<PurposeId>(() => { const stored = localStorage.getItem('videoPurpose'); return stored ? (PURPOSES.find(p => p.id === stored)?.id ?? 'standard') : 'standard' })
const [mediaType, setMediaType] = useState<MediaType>(() => { const stored = localStorage.getItem('videoMediaType'); return stored === 'stillImage' ? 'stillImage' : 'video' })
  const [playing, setPlaying] = useState(false); const [time, setTime] = useState(0); const [exporting, setExporting] = useState(false); const [exportingImages, setExportingImages] = useState(false); const [loadingImages, setLoadingImages] = useState(false); const [notice, setNotice] = useState(''); const [aiNotice, setAiNotice] = useState('')
  const [bgmFile, setBgmFile] = useState<File | null>(null); const [bgmVolume, setBgmVolume] = useState(.7); const [musicGenerating, setMusicGenerating] = useState<MusicMoodId | null>(null)
  // Auditioning a mood or the currently-selected track shares one hidden <audio> element -
  // playingAudioKey ('selected', or a mood id) drives every play/pause icon's state, and starting
  // any new preview stops whatever was previously playing so only one thing is ever audible.
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null); const [previewLoadingMood, setPreviewLoadingMood] = useState<MusicMoodId | null>(null)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null); const audioPreviewUrlRef = useRef<string | null>(null)
  // The last exported video is held here (as a blob URL) so it can be watched with real playback
  // controls - including its mixed-in BGM - before committing to a download, rather than the file
  // landing straight in the downloads folder the moment "Export video" finishes.
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  // A project-wide logo/watermark (upload once, applies to every slide's preview and export - see
  // drawWatermark above). watermarkImage is derived from watermarkFile so canvas drawImage() calls
  // have a decoded, ready-to-draw element rather than juggling a Blob directly.
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null); const [watermarkImage, setWatermarkImage] = useState<HTMLImageElement | null>(null)
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right'); const [watermarkOpacity, setWatermarkOpacity] = useState(.85); const [watermarkScale, setWatermarkScale] = useState(.18)
  // Which server-side API keys are actually configured (see api/config.ts) - fetched once on
  // mount so Gemini-dependent buttons (and, alongside the existing per-provider connect check,
  // Ollama Cloud) can be disabled immediately with a concrete reason, instead of only discovering
  // a missing key after a failed - and for Gemini, billable - request.
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
  const [geminiPrompt, setGeminiPrompt] = useState<Record<string, string>>({}); const [geminiEditingId, setGeminiEditingId] = useState<string | null>(null)
  const [geminiNewPrompt, setGeminiNewPrompt] = useState(''); const [geminiGenerating, setGeminiGenerating] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false); const [aiProvider, setAiProvider] = useState<AiProviderId>(() => (localStorage.getItem('aiProvider') as AiProviderId) || 'chrome'); const [chromeAiStatus, setChromeAiStatus] = useState<ChromeAiAvailability | null>(null)
  const [ollamaUrl, setOllamaUrl] = useState(() => initialOllamaUrl(localStorage.getItem('ollamaLocalUrl'))); const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('ollamaModel') || 'gemma3:4b'); const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]); const [ollamaConnected, setOllamaConnected] = useState(false)
  const [copyPreset, setCopyPreset] = useState<'auto' | 'engagement' | 'storytelling' | 'product'>('auto'); const [customDirection, setCustomDirection] = useState(''); const [aiLoading, setAiLoading] = useState(false)
  const [caption, setCaption] = useState<AiCaption | null>(null); const [captionLoading, setCaptionLoading] = useState(false); const [captionCopied, setCaptionCopied] = useState(false)
  const [focalDetectingId, setFocalDetectingId] = useState<string | null>(null)
  const [styleDetectingId, setStyleDetectingId] = useState<string | null>(null); const [projectStyleDetecting, setProjectStyleDetecting] = useState(false)
  const [exportedFile, setExportedFile] = useState<File | null>(null)
  const [singleExportingId, setSingleExportingId] = useState<string | null>(null)
  const [globalFontFamily, setGlobalFontFamily] = useState<string>(() => localStorage.getItem('globalFont') || 'Noto Sans JP')
  const [globalColorAdjustments, setGlobalColorAdjustments] = useState<ColorAdjustments>(() => { try { const saved = localStorage.getItem('globalColorAdj'); return saved ? JSON.parse(saved) : DEFAULT_COLOR_ADJUSTMENTS } catch { return DEFAULT_COLOR_ADJUSTMENTS } })
  const [globalTransition, setGlobalTransition] = useState<TransitionType>(() => (localStorage.getItem('globalTransition') as TransitionType) || 'cut')
  const [brandColors, setBrandColors] = useState<BrandColors>(() => { try { const saved = localStorage.getItem('brandColors'); return saved ? JSON.parse(saved) : DEFAULT_BRAND_COLORS } catch { return DEFAULT_BRAND_COLORS } })
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const [globalSubtitle, setGlobalSubtitle] = useState<SubtitleConfig>({ text: '', fontSize: 4, fontFamily: 'Noto Sans JP', color: '#ffffff', bgOpacity: 0.6, position: 'bottom' })
  const slidesRef = useRef<Slide[]>([]); const raf = useRef(0); const startedAt = useRef(0); const inputRef = useRef<HTMLInputElement>(null)
  const durationFloor = minSecondsPerImage(slides.length); const durationCeiling = maxSecondsPerImage(slides.length)
  const slideDurations = slides.map(s => s.duration ?? seconds)
  const hasCustomDurations = slides.some(s => s.duration !== null)
  const total = hasCustomDurations ? totalDurationWithDurations(slideDurations) : slides.length * seconds
  const frame = hasCustomDurations ? getFrameStateWithDurations(time, slideDurations) : getFrameState(time, slides.length, seconds)
  const pattern = getVideoPattern(patternId); const format = getVideoFormat(formatId); const quality = getVideoQuality(qualityId); const purpose = PURPOSES.find(p => p.id === purposeId)!
  // The slide currently on screen in the preview may carry its own pattern override; everything
  // about how *that frame* looks (motion, color grade, decoration, text style) should follow the
  // effective pattern below, while the pattern picker section further down still reflects and
  // controls the project's global default.
  const activeSlide = slides[frame.index] as Slide | undefined
  const effectivePatternId = activeSlide?.patternOverride ?? patternId
  const effectivePattern = getVideoPattern(effectivePatternId)
  const currentSlideDuration = activeSlide?.duration ?? seconds
  const patternFrame = getPatternFrame(effectivePatternId, frame.progress, frame.index, currentSlideDuration)
  const patternName = pattern.name[language]; const formatName = format.name[language]; const qualityName = quality.name[language]; const purposeName = purpose.name[language]
  // Whether the currently-selected provider is actually usable right now, and - if not - why, so
  // every AI-consuming button (existing copy/caption/focal-point ones, and the style-suggestion
  // ones below) can be disabled with a real reason instead of only checking that a model name has
  // been typed into a text field. Chrome needs the on-device model itself downloaded/ready;
  // Ollama (local or cloud) needs a successful connection *for the provider currently selected*
  // (see the aiProvider-keyed reset above) plus a model name to send requests to.
  // Known-unusable *before* even trying to connect: the server itself has no OLLAMA_CLOUD_API_KEY,
  // per api/config.ts. Checking this up front (rather than only after a failed "Connect and fetch
  // models") is exactly the same idea as gating the Gemini features below on serverConfig.gemini.
  const ollamaCloudBlocked = aiProvider === 'ollama-cloud' && serverConfig !== null && !serverConfig.ollamaCloud
  const aiReady = aiEnabled && !ollamaCloudBlocked && (aiProvider === 'chrome' ? chromeAiStatus === 'available' : ollamaConnected && ollamaModel.trim().length > 0)
  const watermarkConfig = watermarkImage ? { image: watermarkImage, position: watermarkPosition, opacity: watermarkOpacity, scale: watermarkScale } : null
  const aiNotReadyReason = ollamaCloudBlocked ? t('aiNeedsServerConfigOllamaCloud') : aiProvider === 'chrome' ? (chromeAiStatus === null ? t('aiNeedsCheckChrome') : chromeAiStatus !== 'available' ? chromeAiAvailabilityMessage(chromeAiStatus, language) : '') : !ollamaConnected ? (aiProvider === 'ollama-local' ? t('aiNeedsCheckOllamaLocal') : t('aiNeedsCheckOllamaCloud')) : !ollamaModel.trim() ? t('aiNeedsModel') : ''
  // Gemini (image generation/editing - see gemini.ts) is a separate, Google-billed capability from
  // the Chrome/Ollama text-only vision models above, gated purely on the server having
  // GEMINI_API_KEY configured - there's no client-side "connect" step since there's nothing to
  // discover beyond that one key's presence.
  const geminiReady = serverConfig?.gemini === true
  const geminiNotReadyReason = serverConfig === null ? t('geminiCheckingConfig') : !serverConfig.gemini ? t('geminiNeedsServerConfig') : ''
  const copyDirections = language === 'en' ? { auto: pattern.copyDirection.en, engagement: 'Invite saves, comments, or shares naturally. Lead with a strong hook.', storytelling: 'Turn the scene into a concise story that makes viewers want to continue.', product: 'Explain the value and outcome clearly without sounding pushy.' } : { auto: pattern.copyDirection.ja, engagement: '保存・コメント・シェアを自然に促す。冒頭で興味を引く', storytelling: '情景と体験を物語として伝え、続きを見たくさせる', product: '商品の価値と利用後の変化を具体的かつ簡潔に伝える' }
  const durationRange = durationFloor === durationCeiling ? `${durationFloor}s` : `${durationFloor}–${durationCeiling}s`
  const durationRangeJa = durationFloor === durationCeiling ? `${durationFloor}秒` : `${durationFloor}〜${durationCeiling}秒`
  const durationHint = !slides.length ? t('durationFloorHint') : language === 'en' ? `For ${slides.length} photos, choose ${durationRange} per image — this range adjusts automatically as the count changes.` : `写真${slides.length}枚の場合、1枚あたり${durationRangeJa}の範囲で選べます。枚数が変わると自動的に調整されます。`
  useEffect(() => { slidesRef.current = slides }, [slides]); useEffect(() => () => slidesRef.current.forEach(slide => URL.revokeObjectURL(slide.url)), [])
  useEffect(() => () => { if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current) }, [])
  useEffect(() => () => { if (previewVideoUrl) URL.revokeObjectURL(previewVideoUrl) }, [previewVideoUrl])
  useEffect(() => {
    if (!watermarkFile) { setWatermarkImage(null); return }
    const url = URL.createObjectURL(watermarkFile); const image = new Image()
    image.onload = () => setWatermarkImage(image); image.src = url
    return () => URL.revokeObjectURL(url)
  }, [watermarkFile])
  useEffect(() => { setSeconds(current => Math.min(Math.max(current, durationFloor), durationCeiling)) }, [durationFloor, durationCeiling])
  useEffect(() => { fetchServerConfig().then(setServerConfig).catch(() => setServerConfig({ ollamaCloud: false, gemini: false })) }, [])
  // ollamaConnected/ollamaModels reflect whichever provider was last successfully checked - without
  // this, switching from an already-connected Local Ollama to Ollama Cloud (or vice versa) would
  // leave every AI button looking "ready" using a connection to the *other* provider, which isn't
  // actually usable for the one now selected. Each provider needs its own explicit check.
  useEffect(() => { setOllamaConnected(false); setOllamaModels([]) }, [aiProvider])
  useEffect(() => { if (!playing || !total) return; startedAt.current = performance.now() - time * 1000; const tick = (now: number) => { const next = (now - startedAt.current) / 1000; if (next >= total) { setTime(0); setPlaying(false); return } setTime(next); raf.current = requestAnimationFrame(tick) }; raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current) }, [playing, total])
  const addImages = async (event: ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/') || isHeicFile(file)); if (!files.length) return; setLoadingImages(true); setNotice(''); try { const loaded = await Promise.all(files.map(async file => { const blob = await normalizeImageFile(file); return new Promise<Slide>((resolve, reject) => { const url = URL.createObjectURL(blob); const image = new Image(); image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, url, image, blob, title: '', cta: '', showText: false, textPosition: 'lower', autoEnhanceFilter: analyzeAutoEnhance(image), autoEnhance: false, focalX: .5, focalY: .5, patternOverride: null, original: null, duration: null, fontFamily: null, colorAdjustments: null, transition: null, subtitle: null }); image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name}: ${t('imageReadError')}`)) }; image.src = url }) })); setSlides(current => [...current, ...loaded]) } catch (error) { setNotice(error instanceof Error ? error.message : t('imageConvertError')) } finally { setLoadingImages(false); event.target.value = '' } }
  const remove = (index: number) => setSlides(current => { URL.revokeObjectURL(current[index].url); if (current[index].original) URL.revokeObjectURL(current[index].original.url); return current.filter((_, i) => i !== index) })
  const updateSlide = (index: number, patch: Partial<Pick<Slide, 'title' | 'cta' | 'showText' | 'textPosition' | 'autoEnhance' | 'focalX' | 'focalY' | 'patternOverride'>>) => setSlides(current => current.map((slide, i) => i === index ? { ...slide, ...patch } : slide))
  const clearSlideCopy = (index: number) => updateSlide(index, { title: '', cta: '', showText: false })
  const changeLanguage = (next: Language) => { setLanguage(next); localStorage.setItem('language', next) }
  const checkChromeAi = async () => { setAiNotice(t('chromeChecking')); try { const status = await prepareChromeAi({ language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }); setChromeAiStatus(status); setAiNotice(chromeAiAvailabilityMessage(status, language)) } catch (error) { setAiNotice(error instanceof Error ? error.message : t('chromePrepareError')) } }
  const isHttpsBlockedLocalOllama = () => aiProvider === 'ollama-local' && location.protocol === 'https:'
  const checkOllama = async () => { setAiNotice(t('connectionChecking')); try { const result = aiProvider === 'ollama-local' ? await discoverLocalOllama(ollamaUrl, language) : { url: ollamaUrl, models: await listOllamaModels(ollamaUrl, aiProvider, undefined, language) }; setOllamaUrl(result.url); setOllamaModels(result.models); setOllamaConnected(true); const selected = selectVisionModel(result.models, ollamaModel); setOllamaModel(selected); localStorage.setItem('ollamaLocalUrl', result.url); localStorage.setItem('ollamaModel', selected); const vision = result.models.filter(supportsVision); if (!result.models.length) setAiNotice(`${t('connectionSuccess')} · ${t('noModels')}`); else setAiNotice(`${t('connectionSuccess')} · ${result.url} · ${result.models.length} ${t('installedModels')} · ${vision.length ? `${t('visionReady')}: ${selected}` : t('visionUnknown')}`) } catch (error) { setOllamaModels([]); setOllamaConnected(false); setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : `${t('notRunning')} ${error instanceof Error ? error.message : ''}`.trim()) } }
  const askAi = async () => { const targets = slides.filter(slide => slide.showText); if (!targets.length) { setAiNotice(t('aiNoSelection')); return } setAiLoading(true); setAiNotice(t('aiWorking')); localStorage.setItem('aiProvider', aiProvider); try { const direction = copyDirections[copyPreset]; const copies = new Map<string, AiCopy>(); for (const slide of targets) copies.set(slide.id, aiProvider === 'chrome' ? await generateChromeAiCopy({ image: slide.blob, direction, customDirection, formatName, language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }) : await generateAiCopy({ baseUrl: ollamaUrl, provider: aiProvider, model: ollamaModel, image: slide.blob, direction, customDirection, formatName, language })); setSlides(current => current.map(slide => { const copy = copies.get(slide.id); return copy ? { ...slide, title: copy.title, cta: copy.cta, showText: true } : slide })); setAiNotice(t('aiApplied')) } catch (error) { setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : error instanceof Error ? error.message : t('aiError')) } finally { setAiLoading(false) } }
  // A single caption + hashtags for the whole post (not per slide), styled toward whichever
  // platform the currently-selected format belongs to, reusing the same AI provider already
  // configured above for per-slide copy.
  const askCaption = async () => { if (!slides.length) return; setCaptionLoading(true); setCaptionCopied(false); setAiNotice(t('captionWorking')); try { const image = slides[0].blob; const direction = copyDirections[copyPreset]; const result = aiProvider === 'chrome' ? await generateChromeAiCaption({ image, platform: format.platform, title, direction, customDirection, language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }) : await generateAiCaption({ baseUrl: ollamaUrl, provider: aiProvider, model: ollamaModel, image, platform: format.platform, title, direction, customDirection, language }); setCaption(result); setAiNotice(t('captionApplied')) } catch (error) { setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : error instanceof Error ? error.message : t('aiError')) } finally { setCaptionLoading(false) } }
  const copyCaption = async () => { if (!caption) return; try { await navigator.clipboard.writeText(`${caption.caption}\n\n${caption.hashtags.join(' ')}`); setCaptionCopied(true); setTimeout(() => setCaptionCopied(false), 2500) } catch { /* clipboard permission denied - the text is still visible to select and copy manually */ } }
  // A non-copywriting use of the same on-device/Ollama vision model: instead of writing text, it
  // locates the main subject so the crop focal point can be set automatically instead of requiring
  // a manual tap. Per-slide (keyed by slide id) so detecting one photo's subject doesn't block or
  // spin the others.
  const detectFocalPoint = async (index: number) => {
    const slide = slides[index]; if (!slide || !aiReady) return
    setFocalDetectingId(slide.id); setAiNotice(t('focalDetecting'))
    try {
      const point = aiProvider === 'chrome' ? await generateChromeAiFocalPoint({ image: slide.blob, language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }) : await generateAiFocalPoint({ baseUrl: ollamaUrl, provider: aiProvider, model: ollamaModel, image: slide.blob, language })
      updateSlide(index, { focalX: point.x, focalY: point.y }); setAiNotice(t('focalDetected'))
    } catch (error) { setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : error instanceof Error ? error.message : t('aiError')) } finally { setFocalDetectingId(null) }
  }
  // A third non-copywriting use of the same vision capability (alongside focal-point detection):
  // rather than writing text or locating a subject, this asks the model to act as a design
  // assistant and pick the best-fitting motion/color style for a photo out of all 18 (see
  // buildStylePrompt in ai.ts) - "generating" the styled image/video by choosing settings for the
  // app's existing deterministic renderer, since no on-device/Ollama model can output pixels
  // directly. detectSlideStyle sets just one photo's override; detectProjectStyle sets the whole
  // project's default pattern from the first photo, for when the batch shares one overall look.
  const detectSlideStyle = async (index: number) => {
    const slide = slides[index]; if (!slide || !aiReady) return
    setStyleDetectingId(slide.id); setAiNotice(t('styleDetecting'))
    try {
      const suggestion = aiProvider === 'chrome' ? await generateChromeAiStyle({ image: slide.blob, language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }) : await generateAiStyle({ baseUrl: ollamaUrl, provider: aiProvider, model: ollamaModel, image: slide.blob, language })
      updateSlide(index, { patternOverride: suggestion.patternId }); setAiNotice(t('styleDetected'))
    } catch (error) { setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : error instanceof Error ? error.message : t('aiError')) } finally { setStyleDetectingId(null) }
  }
  const detectProjectStyle = async () => {
    const slide = slides[0]; if (!slide || !aiReady) return
    setProjectStyleDetecting(true); setAiNotice(t('styleDetecting'))
    try {
      const suggestion = aiProvider === 'chrome' ? await generateChromeAiStyle({ image: slide.blob, language, onDownloadProgress: progress => setAiNotice(`${t('chromePreparing')} ${progress}%`) }) : await generateAiStyle({ baseUrl: ollamaUrl, provider: aiProvider, model: ollamaModel, image: slide.blob, language })
      setPatternId(suggestion.patternId); localStorage.setItem('videoPattern', suggestion.patternId); setAiNotice(t('styleDetected'))
    } catch (error) { setAiNotice(isHttpsBlockedLocalOllama() ? t('ollamaHttpsBlocked') : error instanceof Error ? error.message : t('aiError')) } finally { setProjectStyleDetecting(false) }
  }
  // Turns a Gemini image result into a decoded, ready-to-draw HTMLImageElement the same way
  // addImages does for an uploaded file - canvas drawImage() calls throughout this file expect a
  // loaded <img>, not a raw Blob.
  const loadImageBlob = (blob: Blob): Promise<{ image: HTMLImageElement; url: string }> => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob); const image = new Image()
    image.onload = () => resolve({ image, url }); image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t('imageReadError'))) }
    image.src = url
  })
  // Editing replaces the slide's working image, but keeps whatever was there before (the original
  // upload, or an earlier AI edit) in `original` the *first* time an edit is applied, so it's never
  // a one-way change - "Revert to original" (in the UI) just swaps blob/url/image back from there.
  const editSlideWithGemini = async (index: number) => {
    const slide = slides[index]; if (!slide || !geminiReady) return
    const prompt = geminiPrompt[slide.id]?.trim(); if (!prompt) return
    setGeminiEditingId(slide.id); setAiNotice(t('geminiWorking'))
    try {
      const result = await editGeminiImage({ image: slide.blob, prompt, language })
      const { image, url } = await loadImageBlob(result.blob)
      setSlides(current => current.map((s, i) => i === index ? { ...s, blob: result.blob, url, image, original: s.original ?? { blob: s.blob, url: s.url, image: s.image }, autoEnhanceFilter: analyzeAutoEnhance(image) } : s))
      setAiNotice(t('geminiEditApplied'))
    } catch (error) { setAiNotice(error instanceof Error ? error.message : t('aiError')) } finally { setGeminiEditingId(null) }
  }
  const revertSlideImage = (index: number) => setSlides(current => current.map((s, i) => { if (i !== index || !s.original) return s; URL.revokeObjectURL(s.url); return { ...s, blob: s.original.blob, url: s.original.url, image: s.original.image, original: null } }))
  // Unlike editSlideWithGemini, this has no input photo - it's a from-scratch generation, so the
  // result is always additive (a new slide) rather than replacing anything.
  const generateNewSlideWithGemini = async () => {
    const prompt = geminiNewPrompt.trim(); if (!prompt || !geminiReady) return
    setGeminiGenerating(true); setAiNotice(t('geminiWorking'))
    try {
      const result = await generateGeminiImage({ prompt, language })
      const { image, url } = await loadImageBlob(result.blob)
      const newSlide: Slide = { id: crypto.randomUUID(), name: `${prompt.slice(0, 40) || 'gemini-image'}.png`, url, image, blob: result.blob, title: '', cta: '', showText: false, textPosition: 'lower', autoEnhanceFilter: analyzeAutoEnhance(image), autoEnhance: false, focalX: .5, focalY: .5, patternOverride: null, original: null }
      setSlides(current => [...current, newSlide]); setGeminiNewPrompt(''); setAiNotice(t('geminiGenerateApplied'))
    } catch (error) { setAiNotice(error instanceof Error ? error.message : t('aiError')) } finally { setGeminiGenerating(false) }
  }
  // BGM only applies to the WebCodecs/MP4 path below (AudioBufferSource is a mediabunny/MP4
  // concept). The MediaRecorder-based WebM fallback stays video-only - real-time mixing there
  // would need actually *playing* the track back live while capturing, which is a materially
  // different (and much less reliable) implementation, not justified for what's already a
  // best-effort fallback for browsers without WebCodecs encode support.
  const prepareBgm = async (durationSeconds: number, sampleRate: number, numberOfChannels: number) => { if (!bgmFile) return null; const codec = await pickAudioCodec(numberOfChannels, sampleRate); if (!codec) return null; const context = new AudioContext(); try { const decoded = await decodeAudioFile(bgmFile, context); return { buffer: fitAudioBuffer(context, decoded, durationSeconds, bgmVolume), codec } } finally { context.close() } }
  // A built-in alternative to uploading a track: synthesizes an original, royalty-free-by-
  // construction chord progression (see generated-music.ts) sized to comfortably loop for however
  // long the video ends up being, then hands it to setBgmFile so it flows through the exact same
  // trim/loop/fade/export pipeline as an upload - no separate code path needed downstream.
  const useGeneratedMusic = async (mood: MusicMoodId) => { setMusicGenerating(mood); setNotice(''); try { const targetSeconds = Math.min(60, Math.max(12, total || 12)); setBgmFile(await generateMusicFile(mood, targetSeconds, language)) } catch (error) { setNotice(error instanceof Error ? error.message : t('bgmGenerateError')) } finally { setMusicGenerating(null) } }
  const stopAudioPreview = () => { audioPreviewRef.current?.pause(); if (audioPreviewUrlRef.current) { URL.revokeObjectURL(audioPreviewUrlRef.current); audioPreviewUrlRef.current = null } setPlayingAudioKey(null) }
  // Shared by every play/pause icon below (mood cards + the currently-selected track): swaps the
  // one hidden <audio> element's source and plays it, keyed so the right icon can show as playing.
  const playAudioPreview = async (key: string, blob: Blob) => {
    stopAudioPreview(); const url = URL.createObjectURL(blob); audioPreviewUrlRef.current = url; setPlayingAudioKey(key)
    const audio = audioPreviewRef.current; if (!audio) return
    audio.src = url
    try { await audio.play() } catch { setPlayingAudioKey(null) }
  }
  // Auditioning a mood is deliberately separate from selecting it (useGeneratedMusic) - this
  // generates a short (8s) clip just to hear the character of the mood, without replacing whatever
  // BGM is already chosen. A short duration keeps the OfflineAudioContext render effectively
  // instant, so the preview starts as soon as you tap it.
  const previewMood = async (mood: MusicMoodId) => {
    if (playingAudioKey === mood) { stopAudioPreview(); return }
    setPreviewLoadingMood(mood)
    try { await playAudioPreview(mood, audioBufferToWavBlob(await synthesizeMusic(mood, 8))) } catch { setPlayingAudioKey(null) } finally { setPreviewLoadingMood(null) }
  }
  const previewSelectedBgm = async () => { if (!bgmFile) return; if (playingAudioKey === 'selected') { stopAudioPreview(); return } await playAudioPreview('selected', bgmFile) }
  // Renders the video and hands it to the <video> review player below (see previewVideoUrl) rather
  // than downloading it immediately - so a render that came out wrong (bad crop, no audio, etc.)
  // doesn't quietly land in the downloads folder before anyone's actually watched it.
  const exportVideo = async () => { if (!slides.length) return; setExporting(true); setExportedFile(null); try { const canvas = document.createElement('canvas'); canvas.width = format.width * quality.scale; canvas.height = format.height * quality.scale; const subtitle = subtitleEnabled ? globalSubtitle : null; const draw = (ctx: CanvasRenderingContext2D, elapsed: number) => { const state = hasCustomDurations ? getFrameStateWithDurations(elapsed, slideDurations) : getFrameState(elapsed, slides.length, seconds); const slide = slides[state.index]; const dur = slide.duration ?? seconds; drawFrame(ctx, slide, state.progress, slide.title || title, slide.cta || cta, slide.patternOverride ?? patternId, formatId, state.index, dur, watermarkConfig, globalFontFamily, globalColorAdjustments, brandColors, subtitle) }; let lastPreview = -1; const onProgress = (elapsed: number) => { if (elapsed - lastPreview >= .1) { setTime(elapsed); lastPreview = elapsed } }; const codec = await pickVideoCodec(canvas.width, canvas.height, quality.bitsPerSecond); const audio = codec ? await prepareBgm(total, 48000, 2).catch(() => null) : null; const result = codec ? { blob: await renderMp4({ canvas, fps: quality.fps, bitrate: quality.bitsPerSecond, durationSeconds: total, codec, draw, onProgress, audio: audio ?? undefined }), extension: 'mp4' } : 'MediaRecorder' in window ? { blob: await renderWebm({ canvas, fps: quality.fps, bitrate: quality.bitsPerSecond, durationSeconds: total, draw, onProgress }), extension: 'webm' } : null; if (!result) return; const fileName = `${format.fileName}.${result.extension}`; setTime(0); setPreviewVideoUrl(URL.createObjectURL(result.blob)); setExportedFile(new File([result.blob], fileName, { type: result.blob.type })) } finally { setExporting(false) } }
  // The actual download, deferred until the reviewer taps it in the player below. Reuses the same
  // blob URL already backing the <video> instead of minting a second one for the same bytes.
  const downloadVideo = () => { if (!previewVideoUrl || !exportedFile) return; const link = document.createElement('a'); link.href = previewVideoUrl; link.download = exportedFile.name; link.click() }
  const discardPreview = () => setPreviewVideoUrl(null)
  // Web Share API (mobile browsers only, feature-detected): hands the exported file straight to
  // the OS share sheet so a user can pick Instagram/TikTok/YouTube's own app and post directly,
  // instead of hunting for the file in a downloads folder. Desktop browsers generally don't
  // implement the file-sharing variant, so the button simply doesn't render there.
  const canShareFile = (file: File) => typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  const shareVideo = async () => { if (!exportedFile) return; try { await navigator.share({ files: [exportedFile], title: title || undefined, text: caption ? `${caption.caption}\n\n${caption.hashtags.join(' ')}` : undefined }) } catch { /* user canceled the share sheet, or the browser rejected it - nothing to recover from */ } }
  // Exports every slide as its own still image (e.g. an Instagram carousel post) instead of a
  // video - same pattern color grade/decoration/text, frozen at a clean, fully-opaque moment.
  // Downloads land one at a time with a short gap between them so browsers don't treat the burst
  // of triggered downloads as something to block.
  const exportImages = async () => { if (!slides.length) return; setExportingImages(true); try { const canvas = document.createElement('canvas'); canvas.width = format.width; canvas.height = format.height; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; const subtitle = subtitleEnabled ? globalSubtitle : null; for (let index = 0; index < slides.length; index++) { const slide = slides[index]; drawStaticFrame(ctx, slide, slide.title || title, slide.cta || cta, slide.patternOverride ?? patternId, formatId, index, watermarkConfig, globalFontFamily, globalColorAdjustments, brandColors, subtitle); const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .95)); if (!blob) continue; const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${format.fileName}-${String(index + 1).padStart(2, '0')}.jpg`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 4000); if (index < slides.length - 1) await new Promise(resolve => setTimeout(resolve, 350)) } } finally { setExportingImages(false) } }
  // Exports just the one slide, at its own effective pattern (override or project default) - for
  // when a single photo needs its own post rather than being part of the carousel/video batch.
  const exportSingleImage = async (index: number) => { const slide = slides[index]; if (!slide) return; setSingleExportingId(slide.id); try { const canvas = document.createElement('canvas'); canvas.width = format.width; canvas.height = format.height; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; const subtitle = subtitleEnabled ? globalSubtitle : null; drawStaticFrame(ctx, slide, slide.title || title, slide.cta || cta, slide.patternOverride ?? patternId, formatId, index, watermarkConfig, globalFontFamily, globalColorAdjustments, brandColors, subtitle); const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .95)); if (!blob) return; const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${format.fileName}-${String(index + 1).padStart(2, '0')}.jpg`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 4000) } finally { setSingleExportingId(null) } }
  const styleVars = { '--pattern-accent': effectivePattern.accent, '--preview-ratio': `${format.width}/${format.height}`, '--safe-top': `${format.safeTop * 100}%`, '--safe-bottom': `${format.safeBottom * 100}%` } as CSSProperties
  return <div className="app-shell"><header><div className="brand"><span className="brand-mark">F</span><span>Frameflow</span></div><div className="header-actions"><span className="eyebrow">MULTI-FORMAT VIDEO STUDIO</span><div className="language-switch" role="group" aria-label={t('language')}><span>{t('language')}</span><button className={language==='en'?'active':''} aria-pressed={language==='en'} onClick={()=>changeLanguage('en')}>EN</button><button className={language==='ja'?'active':''} aria-pressed={language==='ja'} onClick={()=>changeLanguage('ja')}>日本語</button></div></div></header><main><section className="intro"><p className="kicker">IMAGES TO MOTION</p><h1>{language==='en'?<>Turn photos into <em>moving stories.</em></>:<>写真から、<em>動く物語</em>を。</>}</h1><p>{language==='en'?'Create polished Reels, Stories, posts and Shorts with format-aware high-quality settings.':'リール、ストーリー、フィード、Shortsを用途別の高品質設定で仕上げます。'}</p></section><div className="workspace"><section className="editor panel">
    <div className="section-head"><div><span>01</span><h2>{t('buildStory')}</h2></div><button className="add-small" onClick={() => inputRef.current?.click()}>＋ {t('addImages')}</button></div><input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={addImages}/>{notice && <p className="notice" role="alert">{notice}</p>}
    {slides.length === 0 ? <button className="dropzone" disabled={loadingImages} onClick={() => inputRef.current?.click()}><span className="upload-icon">↗</span><strong>{loadingImages ? t('converting') : t('selectPhotos')}</strong><small>JPG / PNG / WEBP / HEIC / HEIF</small></button> : <div className="story-list">{slides.map((slide,index)=><article className="story-item" key={slide.id}><img src={slide.url} alt=""/><div className="story-meta"><b>{String(index+1).padStart(2,'0')}</b><span>{slide.name}</span></div><div className="item-actions"><button disabled={index===0} onClick={()=>setSlides(moveItem(slides,index,index-1))}>↑</button><button disabled={index===slides.length-1} onClick={()=>setSlides(moveItem(slides,index,index+1))}>↓</button><button onClick={()=>remove(index)}>×</button></div></article>)}</div>}
    <section className="format-section"><div className="pattern-head"><div><span>▣</span><div><h3>{t('formatTitle')}</h3><p>{t('optimizeSafeArea')}</p></div></div><strong>{format.width} × {format.height}</strong></div>
<div className="media-type-row">{MEDIA_TYPES.map(item=><div className="media-type-tab {mediaType===item.id?'active':''}" onClick={()=>{setMediaType(item.id);localStorage.setItem('videoMediaType',item.id)}}><span>{item.name[language]}</span></div>)}</div>
{mediaType === 'video' ? (
  <div className="video-controls">
    <div className="quality-row">{VIDEO_QUALITIES.map(item=><button key={item.id} className={qualityId===item.id?'active':''} aria-pressed={qualityId===item.id} onClick={()=>{setQualityId(item.id);localStorage.setItem('videoQuality',item.id)}}><b>{item.name[language]}</b><small>{item.description[language]}</small></button>)}</div>
    <div className="purpose-row">{PURPOSES.map(item=><button key={item.id} className={purposeId===item.id?'active':''} aria-pressed={purposeId===item.id} onClick={()=>{setPurposeId(item.id);localStorage.setItem('videoPurpose',item.id)}}><b>{item.name[language]}</b><small>{item.description[language]}</small></button>)}</div>
  </div>
) : (
  <div className="still-image-controls">
    <div className="quality-row">{VIDEO_QUALITIES.map(item=><button key={item.id} className={qualityId===item.id?'active':''} aria-pressed={qualityId===item.id} onClick={()=>{setQualityId(item.id);localStorage.setItem('videoQuality',item.id)}}><b>{item.name[language]}</b><small>{item.description[language]}</small></button>)}</div>
    <div className="purpose-row">{STILL_IMAGE_PURPOSES.map(item=><button key={item.id} className={purposeId===item.id?'active':''} aria-pressed={purposeId===item.id} onClick={()=>{setPurposeId(item.id);localStorage.setItem('videoPurpose',item.id)}}><b>{item.name[language]}</b><small>{item.description[language]}</small></button>)}</div>
  </div>
)}
{total>format.recommendedMaxSeconds&&<small className="field-help format-duration-hint">{t('durationOverHint').replace('{seconds}', String(Math.round(total))).replace('{max}', String(format.recommendedMaxSeconds))}</small>}</section>
    <div className="fields"><label>{t('defaultTitle')}<input value={title} maxLength={28} onChange={e=>setTitle(e.target.value)}/></label><label>{t('defaultCta')}<input value={cta} maxLength={32} onChange={e=>setCta(e.target.value)}/></label><small className="field-help">{t('commonFallback')}</small><label>{t('duration')}<div className="range-row"><input type="range" min={durationFloor} max={durationCeiling} value={seconds} onChange={e=>setSeconds(Number(e.target.value))}/><output>{seconds}{t('seconds')}</output></div></label><small className="field-help">{durationHint}</small></div>
    {slides.length>0&&<section className="slide-copy-section"><div className="pattern-head"><div><span>✎</span><div><h3>{t('slideCopy')} <strong className="copy-count">{slides.length}</strong></h3><p>{t('perSlideHint')}</p></div></div></div><div className="slide-copy-list">{slides.map((slide,index)=><article className="slide-copy-card" key={`copy-${slide.id}`}><div className="slide-copy-heading"><div className="copy-identity"><button type="button" className="focal-thumb" title={t('focalHint')} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();updateSlide(index,{focalX:Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width)),focalY:Math.min(1,Math.max(0,(e.clientY-rect.top)/rect.height))})}}><img src={slide.url} alt="" style={{objectPosition:`${slide.focalX*100}% ${slide.focalY*100}%`}}/><span className="focal-dot" style={{left:`${slide.focalX*100}%`,top:`${slide.focalY*100}%`}}/></button><div><b>{String(index+1).padStart(2,'0')} · {slide.name}</b><small>{slide.title||slide.cta?t('showText'):t('copyEmpty')}</small></div></div><div className="copy-actions"><label className="inline-toggle"><input type="checkbox" checked={slide.showText} onChange={e=>updateSlide(index,{showText:e.target.checked})}/>{t('showText')}</label><label className="inline-toggle"><input type="checkbox" checked={slide.autoEnhance} onChange={e=>updateSlide(index,{autoEnhance:e.target.checked})}/>{t('autoEnhance')}</label>{aiEnabled&&<button className="clear-copy focal-ai-btn" disabled={focalDetectingId===slide.id||!aiReady} title={t('focalDetectHint')} onClick={()=>detectFocalPoint(index)}>{focalDetectingId===slide.id?t('focalDetecting'):`✦ ${t('focalDetect')}`}</button>}{aiEnabled&&<button className="clear-copy focal-ai-btn" disabled={styleDetectingId===slide.id||!aiReady} title={t('styleDetectHint')} onClick={()=>detectSlideStyle(index)}>{styleDetectingId===slide.id?t('styleDetecting'):`✦ ${t('styleDetect')}`}</button>}{(slide.focalX!==.5||slide.focalY!==.5)&&<button className="clear-copy" onClick={()=>updateSlide(index,{focalX:.5,focalY:.5})}>{t('resetFocal')}</button>}<button className="clear-copy focal-ai-btn" disabled={singleExportingId===slide.id} title={t('exportSingleHint')} onClick={()=>exportSingleImage(index)}>{singleExportingId===slide.id?t('exportingImages'):`↓ ${t('exportSingle')}`}</button><button className="clear-copy" title={t('clearConfirm')} onClick={()=>clearSlideCopy(index)}>{t('clearCopy')}</button></div></div><div className="slide-copy-grid"><label>{t('defaultTitle')}<input value={slide.title} maxLength={28} placeholder={t('copyEmpty')} onChange={e=>updateSlide(index,{title:e.target.value,showText:Boolean(e.target.value||slide.cta)})}/></label><label>{t('defaultCta')}<input value={slide.cta} maxLength={32} placeholder={t('copyEmpty')} onChange={e=>updateSlide(index,{cta:e.target.value,showText:Boolean(slide.title||e.target.value)})}/></label><label>{t('textPosition')}<select value={slide.textPosition} onChange={e=>updateSlide(index,{textPosition:e.target.value as TextPosition})}><option value="lower">{t('lower')}</option><option value="center">{t('center')}</option><option value="upper">{t('upper')}</option></select></label><label>{t('slidePattern')}<select value={slide.patternOverride??''} onChange={e=>updateSlide(index,{patternOverride:e.target.value?e.target.value as VideoPatternId:null})}><option value="">{t('slidePatternDefault')} ({patternName})</option>{VIDEO_PATTERNS.map(item=><option key={item.id} value={item.id}>{item.name[language]}</option>)}</select></label></div>{geminiReady&&<div className="gemini-edit-row"><input value={geminiPrompt[slide.id]??''} placeholder={t('geminiEditPromptPlaceholder')} onChange={e=>setGeminiPrompt(current=>({...current,[slide.id]:e.target.value}))}/><button type="button" className="clear-copy focal-ai-btn" disabled={geminiEditingId===slide.id||!(geminiPrompt[slide.id]??'').trim()} onClick={()=>editSlideWithGemini(index)}>{geminiEditingId===slide.id?t('geminiWorking'):`◈ ${t('geminiEditButton')}`}</button></div>}{slide.original&&<button type="button" className="clear-copy" title={t('geminiRevertHint')} onClick={()=>revertSlideImage(index)}>↺ {t('geminiRevertButton')}</button>}</article>)}</div></section>}
    <section className="pattern-section"><div className="pattern-head"><div><span>✦</span><div><h3>{t('motionTitle')}</h3><p>{t('patternDescription')}</p></div></div><strong>{patternName}</strong></div>{aiEnabled&&slides.length>0&&<button type="button" className="clear-copy focal-ai-btn project-style-btn" disabled={projectStyleDetecting||!aiReady} title={t('projectStyleDetectHint')} onClick={detectProjectStyle}>{projectStyleDetecting?t('styleDetecting'):`✦ ${t('projectStyleDetect')}`}</button>}<div className="pattern-grid">{VIDEO_PATTERNS.map(item=><button key={item.id} className={patternId===item.id?'active':''} aria-pressed={patternId===item.id} style={{'--pattern-accent':item.accent} as CSSProperties} onClick={()=>{setPatternId(item.id);localStorage.setItem('videoPattern',item.id);setPlaying(false)}}><span className="pattern-preview"><i/><i/><i/></span><b>{item.name[language]}</b><small>{item.description[language]}</small></button>)}</div></section>
    <section className="watermark-section"><div className="pattern-head"><div><span>❏</span><div><h3>{t('watermarkTitle')}</h3><p>{t('watermarkHint')}</p></div></div></div>{watermarkFile?<div className="watermark-editor"><div className="watermark-preview-row"><img src={watermarkImage?.src} alt="" className="watermark-thumb"/><div><b>{watermarkFile.name}</b><small>{t('watermarkAppliesHint')}</small></div><button type="button" className="clear-copy" onClick={()=>setWatermarkFile(null)}>{t('watermarkRemove')}</button></div><label>{t('watermarkPosition')}<div className="watermark-position-grid">{WATERMARK_POSITIONS.map(pos=><button key={pos} type="button" className={watermarkPosition===pos?'active':''} aria-pressed={watermarkPosition===pos} onClick={()=>setWatermarkPosition(pos)}>{t(watermarkPositionLabelKey(pos))}</button>)}</div></label><label>{t('watermarkOpacity')}<div className="range-row"><input type="range" min=".15" max="1" step=".05" value={watermarkOpacity} onChange={e=>setWatermarkOpacity(Number(e.target.value))}/><output>{Math.round(watermarkOpacity*100)}%</output></div></label><label>{t('watermarkSize')}<div className="range-row"><input type="range" min=".08" max=".4" step=".01" value={watermarkScale} onChange={e=>setWatermarkScale(Number(e.target.value))}/><output>{Math.round(watermarkScale*100)}%</output></div></label></div>:<label className="bgm-upload"><input type="file" accept="image/*" hidden onChange={e=>setWatermarkFile(e.target.files?.[0]??null)}/>❏ {t('watermarkAdd')}</label>}</section>
    <section className="bgm-section"><div className="pattern-head"><div><span>♪</span><div><h3>{t('bgmTitle')}</h3><p>{t('bgmHint')}</p></div></div></div><audio ref={audioPreviewRef} hidden onEnded={()=>setPlayingAudioKey(null)}/>{bgmFile?<div className="bgm-selected"><button type="button" className="audio-preview-btn" title={t('previewSample')} onClick={previewSelectedBgm}>{playingAudioKey==='selected'?'⏸':'▶'}</button><div><b>{bgmFile.name}</b><small>{t('bgmVolume')}</small></div><input type="range" min="0" max="1" step=".05" value={bgmVolume} onChange={e=>setBgmVolume(Number(e.target.value))}/><button className="clear-copy" onClick={()=>{stopAudioPreview();setBgmFile(null)}}>{t('bgmRemove')}</button></div>:<><label className="bgm-upload"><input type="file" accept="audio/*" hidden onChange={e=>setBgmFile(e.target.files?.[0]??null)}/>♪ {t('bgmAdd')}</label><div className="bgm-builtin"><small>{t('bgmBuiltinHint')}</small><div className="bgm-mood-grid">{MUSIC_MOODS.map(mood=><div className="mood-card" key={mood.id}><button type="button" className="mood-select" disabled={musicGenerating!==null} onClick={()=>useGeneratedMusic(mood.id)}><b>{musicGenerating===mood.id?t('bgmGenerating'):mood.name[language]}</b><small>{mood.description[language]}</small></button><button type="button" className="audio-preview-btn" title={t('previewSample')} disabled={previewLoadingMood!==null&&previewLoadingMood!==mood.id} onClick={()=>previewMood(mood.id)}>{previewLoadingMood===mood.id?'…':playingAudioKey===mood.id?'⏸':'▶'}</button></div>)}</div></div></>}<small className="field-help">{t('bgmWebmNote')}</small></section>
    {aiNotice&&<p className="ai-notice" role="status">{aiNotice}</p>}
    <section className="ai-card"><div className="ai-card-head"><div><span className="ai-spark">✦</span><div><h3>{t('aiCopy')}</h3><p>{t('aiCopyDescription')}</p></div></div><button className={`toggle ${aiEnabled?'on':''}`} aria-pressed={aiEnabled} onClick={()=>setAiEnabled(!aiEnabled)}><span/></button></div>{aiEnabled&&<div className="ai-fields"><div className="provider-tabs three"><button className={aiProvider==='chrome'?'active':''} onClick={()=>setAiProvider('chrome')}>{t('chromeProvider')}</button><button className={aiProvider==='ollama-local'?'active':''} onClick={()=>setAiProvider('ollama-local')}>{t('localOllama')}</button><button className={aiProvider==='ollama-cloud'?'active':''} onClick={()=>setAiProvider('ollama-cloud')}>{t('ollamaCloud')}</button></div>
      <div className={`ai-ready-status ${aiReady?'ready':'not-ready'}`} role="status">{aiReady?`✓ ${t('aiReadyStatus')}`:`⚠ ${aiNotReadyReason}`}</div>
      {aiProvider==='chrome'?<><button className="ai-check" onClick={checkChromeAi}>{t('checkChrome')}</button>{chromeAiStatus&&<small className="ai-status">{chromeAiAvailabilityMessage(chromeAiStatus, language)}</small>}<small>{t('chromeHint')}</small></>:<><div className="ai-grid">{aiProvider==='ollama-local'&&<label>{t('localEndpoint')}<input value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)}/></label>}<label>{t('visionModel')}<input list="ollama-models" value={ollamaModel} onChange={e=>setOllamaModel(e.target.value)}/><datalist id="ollama-models">{ollamaModels.map(model=><option key={model.name} value={model.name}>{supportsVision(model)?t('visionReady'):t('visionUnknown')}</option>)}{RECOMMENDED_VISION_MODELS.map(model=><option key={model.name} value={model.name}>{model.note[language]}</option>)}</datalist></label></div><button className="ai-check" onClick={checkOllama}>{aiProvider==='ollama-local'?t('detectOllama'):t('fetchModels')}</button><small>{aiProvider==='ollama-cloud'?t('cloudHint'):t('ollamaHint')}</small>{aiProvider==='ollama-local'&&<>{ollamaConnected&&<div className="ollama-result"><b>{t('connectedEndpoint')}</b><code>{ollamaUrl}</code><b>{t('installedModels')} ({ollamaModels.length})</b>{ollamaModels.length?<ul>{ollamaModels.map(model=><li key={model.name}><code>{model.name}</code><span className={supportsVision(model)?'vision-ok':'vision-unknown'}>{supportsVision(model)?t('visionReady'):t('visionUnknown')}</span></li>)}</ul>:<small>{t('noModels')}</small>}</div>}<details className="ollama-help" open={!ollamaConnected||!ollamaModels.length}><summary>{t('ollamaHelpTitle')}</summary><p>{t('ollamaBrowserLimit')}</p><ol><li>{t('ollamaHelp1')}</li><li>{t('ollamaHelp2')}</li><li>{t('ollamaHelp3')}</li><li>{t('ollamaHelp4')}</li></ol><code>OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve</code></details></>}</>}
      <small className="per-slide-note">{t('aiSelectHint')}</small>{slides.length>0&&<div className="ai-select"><div className="ai-select-grid">{slides.map((slide,index)=><button key={slide.id} type="button" className={`ai-select-thumb ${slide.showText?'selected':''}`} aria-pressed={slide.showText} onClick={()=>updateSlide(index,{showText:!slide.showText})}><img src={slide.url} alt=""/>{slide.showText&&<span className="ai-select-check">✓</span>}</button>)}</div><div className="ai-select-actions"><button type="button" onClick={()=>setSlides(current=>current.map(slide=>({...slide,showText:true})))}>{t('selectAll')}</button><button type="button" onClick={()=>setSlides(current=>current.map(slide=>({...slide,showText:false})))}>{t('selectNone')}</button></div></div>}<label>{t('copyDirection')}<select value={copyPreset} onChange={e=>setCopyPreset(e.target.value as typeof copyPreset)}><option value="auto">{t('auto')}</option><option value="engagement">{t('engagement')}</option><option value="storytelling">{t('storytelling')}</option><option value="product">{t('product')}</option></select><small className="direction-preview">{copyDirections[copyPreset]}</small></label><label>{t('customRequest')}<textarea rows={3} value={customDirection} onChange={e=>setCustomDirection(e.target.value)}/></label><button className="ai-generate" disabled={!slides.length||aiLoading||!aiReady} onClick={askAi}>{aiLoading?t('generating'):`✦ ${t('generateCopy')}`}</button>
      <div className="caption-card"><b>{t('captionTitle')}</b><small>{t('captionHint').replace('{platform}', t(platformLabelKey(format.platform)))}</small><button className="ai-generate secondary" disabled={!slides.length||captionLoading||!aiReady} onClick={askCaption}>{captionLoading?t('generating'):`✎ ${t('generateCaption')}`}</button>{caption&&<div className="caption-result"><p>{caption.caption}</p>{caption.hashtags.length>0&&<div className="caption-hashtags">{caption.hashtags.map(tag=><span key={tag}>{tag}</span>)}</div>}<button type="button" className="clear-copy caption-copy-btn" onClick={copyCaption}>{captionCopied?t('captionCopied'):t('captionCopy')}</button></div>}</div>
    </div>}</section>
    <section className="gemini-card"><div className="ai-card-head"><div><span className="ai-spark">◈</span><div><h3>{t('geminiTitle')}</h3><p>{t('geminiHint')}</p></div></div></div><div className={`ai-ready-status ${geminiReady?'ready':'not-ready'}`} role="status">{geminiReady?`✓ ${t('aiReadyStatus')}`:`⚠ ${geminiNotReadyReason}`}</div>
      <div className="gemini-generate"><b>{t('geminiGenerateTitle')}</b><textarea rows={2} placeholder={t('geminiGeneratePromptPlaceholder')} value={geminiNewPrompt} onChange={e=>setGeminiNewPrompt(e.target.value)}/><button className="ai-generate secondary" disabled={!geminiReady||geminiGenerating||!geminiNewPrompt.trim()} onClick={generateNewSlideWithGemini}>{geminiGenerating?t('geminiWorking'):`◈ ${t('geminiGenerateButton')}`}</button></div>
    </section>
  </section><section className="preview-side"><div className="section-head preview-title"><div><span>02</span><h2>{t('preview')}</h2></div><small>{formatName} · {qualityName} · {purposeName}</small></div><div className={`phone pattern-${effectivePatternId} ${format.width>format.height?'landscape':''}`} style={styleVars}><div className="phone-screen">{slides.length?<><img className="hero-image" src={slides[frame.index]?.url} alt={t('previewAlt')} style={{transform:patternTransform(patternFrame),opacity:patternFrame.imageOpacity,filter:slides[frame.index]?.autoEnhance?`${effectivePattern.filter} ${slides[frame.index]?.autoEnhanceFilter}`:effectivePattern.filter,objectPosition:`${(slides[frame.index]?.focalX??.5)*100}% ${(slides[frame.index]?.focalY??.5)*100}%`}}/><div className="scrim" style={{opacity:patternFrame.overlayOpacity}}/>{effectivePattern.decoration==='letterbox'&&<><div className="letterbox-bar top"/><div className="letterbox-bar bottom"/></>}{(effectivePattern.decoration==='vignette'||effectivePattern.decoration==='frame')&&<div className={`vignette-overlay ${effectivePattern.decoration}`}/>}{patternFrame.flashOpacity>0&&<div className="flash-overlay" style={{opacity:patternFrame.flashOpacity}}/>}{effectivePattern.decoration==='badge'&&<div className="accent-badge" style={{transform:`scale(${patternFrame.textScale})`}}>✦</div>}{effectivePattern.decoration==='grain'&&<div className="grain-overlay"/>}{effectivePattern.decoration==='scanlines'&&<div className="scanline-overlay"/>}{effectivePattern.decoration==='polaroid'&&<div className="polaroid-frame"><i/><i/></div>}{effectivePattern.decoration==='tracking'&&<div className="tracking-line"/>}{effectivePattern.decoration==='glow'&&<div className="glow-overlay"/>}{effectivePattern.decoration==='halftone'&&<div className="halftone-overlay"/>}{effectivePattern.decoration==='blockframe'&&<div className="block-frame"/>}{effectivePattern.decoration==='duotone'&&<div className="duotone-overlay"/>}{effectivePattern.decoration==='gridline'&&<div className="gridline-overlay"/>}{effectivePattern.decoration==='slash'&&<div className="slash-overlay"><i/><i/></div>}{effectivePattern.decoration==='shimmer'&&<div className="shimmer-frame"/>}{effectivePattern.decoration==='stamp'&&<div className="stamp-frame"><i/></div>}{effectivePattern.decoration==='sparkle'&&<div className="sparkle-overlay"><i/><i/><i/><i/><i/></div>}{watermarkImage&&<img className={`watermark-live watermark-${watermarkPosition}`} src={watermarkImage.src} alt="" style={{opacity:watermarkOpacity,width:`${watermarkScale*100}%`}}/>}<div className="safe-guide"/>{slides[frame.index]?.showText&&<div className={`reel-copy position-${slides[frame.index]?.textPosition}`} style={{opacity:patternFrame.textOpacity,transform:`translateY(${patternFrame.textTranslateY}px) scale(${patternFrame.textScale})`}}><h3>{slides[frame.index]?.title||title||'My story'}</h3>{(slides[frame.index]?.cta||cta)&&<p>{slides[frame.index]?.cta||cta}</p>}</div>}<div className="counter">{frame.index+1} / {slides.length}</div><div className="pattern-badge">{effectivePattern.name[language]}</div></>:<div className="empty-preview"><span>✦</span><p>{t('emptyPreviewLong')}</p></div>}</div></div><div className="transport"><button className="play" disabled={!slides.length} onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ':'▶'}</button><input type="range" min="0" max={total||1} step=".01" value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value))}}/><time>{Math.floor(time)}s / {total}s</time></div><button className="export" disabled={!slides.length||exporting} onClick={exportVideo}>{exporting?t('exporting'):t('exportVideo')}<span>MP4 · {format.width} × {format.height} · {quality.fps}fps</span></button>{previewVideoUrl&&<div className="video-review"><div className="video-review-head"><b>{t('reviewTitle')}</b><button type="button" className="review-close" title={t('reviewDiscard')} onClick={discardPreview}>×</button></div><video src={previewVideoUrl} controls playsInline loop className="review-video"/><div className="review-actions"><button className="export" onClick={downloadVideo}>⬇ {t('downloadVideo')}</button>{exportedFile&&canShareFile(exportedFile)&&<button className="export secondary" onClick={shareVideo}>↗ {t('shareVideo')}</button>}</div></div>}<button className="export secondary" disabled={!slides.length||exportingImages} onClick={exportImages}>{exportingImages?t('exportingImages'):t('exportImages')}<span>JPG × {slides.length || 0} · {format.width} × {format.height}</span></button></section></div></main><footer><span>FRAMEFLOW / MULTI-FORMAT EDITION</span><span>{t('privacy')}</span></footer></div>
}
