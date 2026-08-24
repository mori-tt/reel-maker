import { describe, expect, it } from 'vitest'
import { VIDEO_FORMATS, VIDEO_PATTERNS, VIDEO_QUALITIES, getFrameState, getMimeType, getPatternFrame, getVideoFormat, getVideoPattern, getVideoQuality, isVideoFormatId, isVideoPatternId, isVideoQualityId, maxSecondsPerImage, minSecondsPerImage, motionMultiplier, moveItem, nextFrameDelayMs } from './reel'

describe('reel timeline', () => {
  it('maps playback time to a slide and local progress', () => {
    expect(getFrameState(2.5, 3, 4)).toEqual({ index: 0, progress: 0.625 })
    expect(getFrameState(4.5, 3, 4)).toEqual({ index: 1, progress: 0.125 })
    expect(getFrameState(99, 3, 4)).toEqual({ index: 2, progress: 1 })
  })

  it('moves an item without mutating the source list', () => {
    const source = ['a', 'b', 'c']
    expect(moveItem(source, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(source).toEqual(['a', 'b', 'c'])
  })

  it('selects the first supported webm mime type', () => {
    const supported = (type: string) => type.includes('vp8')
    expect(getMimeType(supported)).toBe('video/webm;codecs=vp8')
  })

  it('prefers the more efficient av1 codec when the browser supports it', () => {
    const supported = (type: string) => type.includes('av01') || type.includes('vp9')
    expect(getMimeType(supported)).toBe('video/webm;codecs=av01')
  })

  it('schedules export frames on a fixed cadence instead of drifting after slow draws', () => {
    expect(nextFrameDelayMs(0, 1, 30, 10)).toBeCloseTo(23.33, 1)
    expect(nextFrameDelayMs(1000, 3, 60, 1040)).toBeCloseTo(10, 5)
    expect(nextFrameDelayMs(0, 1, 30, 100)).toBe(0)
  })

  it('provides all eighteen selectable video patterns', () => {
    expect(VIDEO_PATTERNS.map(pattern => pattern.id)).toEqual(['cinematic', 'dynamic', 'minimal', 'album', 'social', 'noir', 'neon', 'polaroid', 'vhs', 'glow', 'comic', 'editorial', 'pastel', 'retrowave', 'street', 'luxury', 'travel', 'kawaii'])
    expect(new Set(VIDEO_PATTERNS.map(pattern => pattern.accent)).size).toBe(18)
    expect(getVideoPattern('social').name).toEqual({ en: 'Social trend', ja: 'SNSトレンド' })
    expect(getVideoPattern('neon').name).toEqual({ en: 'Neon', ja: 'ネオン' })
    expect(getVideoPattern('editorial').name).toEqual({ en: 'Editorial', ja: 'エディトリアル' })
    expect(getVideoPattern('retrowave').name).toEqual({ en: 'Retrowave', ja: 'レトロウェイブ' })
    expect(getVideoPattern('kawaii').name).toEqual({ en: 'Kawaii', ja: 'カワイイ' })
  })

  it('gives every new pattern a unique decoration and keeps text styles within the known set', () => {
    const newPatterns = ['pastel', 'retrowave', 'street', 'luxury', 'travel', 'kawaii'] as const
    const decorations = newPatterns.map(id => getVideoPattern(id).decoration)
    expect(new Set(decorations).size).toBe(newPatterns.length)
    const validTextStyles = ['default', 'minimal', 'left', 'upper', 'glow', 'outline', 'elegant']
    for (const id of newPatterns) expect(validTextStyles).toContain(getVideoPattern(id).textStyle)
  })

  it('validates stored pattern ids and falls back safely', () => {
    expect(isVideoPatternId('album')).toBe(true)
    expect(isVideoPatternId('unknown')).toBe(false)
    expect(isVideoPatternId(null)).toBe(false)
  })

  it('provides social formats and quality presets', () => {
    expect(VIDEO_FORMATS.map(format => format.id)).toEqual(['reel', 'story', 'feed-portrait', 'square', 'feed-landscape', 'tiktok', 'tiktok-square', 'shorts', 'youtube-video', 'youtube-square'])
    expect(getVideoFormat('square')).toMatchObject({ width: 1080, height: 1080 })
    expect(getVideoFormat('story').safeTop).toBeGreaterThan(getVideoFormat('reel').safeTop)
    expect(isVideoFormatId('shorts')).toBe(true)
    expect(isVideoFormatId('landscape')).toBe(false)
    expect(VIDEO_QUALITIES.map(quality => quality.id)).toEqual(['standard', 'high', 'ultra'])
    expect(getVideoQuality('high').fps).toBe(60)
    expect(getVideoQuality('high').bitsPerSecond).toBeGreaterThanOrEqual(40_000_000)
    expect(getVideoQuality('high').bitsPerSecond).toBeGreaterThan(getVideoQuality('standard').bitsPerSecond)
    expect(isVideoQualityId('high')).toBe(true)
    expect(getVideoFormat('reel').name.en).toBe('Instagram Reel')
    expect(getVideoFormat('reel').description.en).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
    expect(getVideoQuality('high').name.ja).toBe('高画質')
  })

  it('offers a 4K "Ultra HD" tier that actually renders at a higher resolution, not just a bitrate bump', () => {
    const ultra = getVideoQuality('ultra')
    expect(ultra.scale).toBeGreaterThan(getVideoQuality('high').scale)
    expect(ultra.scale).toBeGreaterThan(getVideoQuality('standard').scale)
    expect(ultra.bitsPerSecond).toBeGreaterThan(getVideoQuality('high').bitsPerSecond)
    expect(isVideoQualityId('ultra')).toBe(true)
  })

  it('covers Instagram, TikTok, and YouTube, each with multiple format variations under a distinct platform tag', () => {
    expect(new Set(VIDEO_FORMATS.map(format => format.platform))).toEqual(new Set(['instagram', 'tiktok', 'youtube']))
    expect(getVideoFormat('tiktok').platform).toBe('tiktok')
    expect(VIDEO_FORMATS.filter(format => format.platform === 'youtube').map(format => format.id)).toEqual(['shorts', 'youtube-video', 'youtube-square'])
    expect(VIDEO_FORMATS.filter(format => format.platform === 'instagram').length).toBe(5)
    expect(VIDEO_FORMATS.filter(format => format.platform === 'tiktok').length).toBe(2)
    // Every format id is unique and every platform has more than one option to choose from.
    expect(new Set(VIDEO_FORMATS.map(format => format.id)).size).toBe(VIDEO_FORMATS.length)
    for (const platform of ['instagram', 'tiktok', 'youtube'] as const) expect(VIDEO_FORMATS.filter(format => format.platform === platform).length).toBeGreaterThan(1)
  })

  it('gives the two landscape formats a wide aspect ratio, everything else 9:16 or narrower', () => {
    const landscapeIds = ['youtube-video', 'feed-landscape']
    expect(getVideoFormat('youtube-video').width / getVideoFormat('youtube-video').height).toBeCloseTo(16 / 9, 2)
    expect(getVideoFormat('feed-landscape').width / getVideoFormat('feed-landscape').height).toBeCloseTo(1.91, 1)
    for (const format of VIDEO_FORMATS) if (!landscapeIds.includes(format.id)) expect(format.width).toBeLessThanOrEqual(format.height)
  })

  it('gives every format a positive, sane recommended duration hint without hard-enforcing it', () => {
    for (const format of VIDEO_FORMATS) { expect(format.recommendedMaxSeconds).toBeGreaterThan(0); expect(format.recommendedMaxSeconds).toBeLessThanOrEqual(3600) }
    // Long-form YouTube tolerates much longer videos than any short-form vertical format.
    expect(getVideoFormat('youtube-video').recommendedMaxSeconds).toBeGreaterThan(getVideoFormat('tiktok').recommendedMaxSeconds)
  })

  it('calculates distinct, bounded motion for every pattern', () => {
    const frames = VIDEO_PATTERNS.map(pattern => getPatternFrame(pattern.id, .5, 1))
    frames.forEach(frame => {
      expect(frame.imageOpacity).toBeGreaterThanOrEqual(0)
      expect(frame.imageOpacity).toBeLessThanOrEqual(1)
      expect(frame.textOpacity).toBeGreaterThanOrEqual(0)
      expect(frame.textOpacity).toBeLessThanOrEqual(1)
      expect(frame.scale).toBeGreaterThan(0)
    })
    expect(new Set(frames.map(frame => `${frame.scale}:${frame.translateX}:${frame.textScale}`)).size).toBe(18)
    expect(getPatternFrame('cinematic', -1)).toEqual(getPatternFrame('cinematic', 0))
    expect(getPatternFrame('cinematic', 2)).toEqual(getPatternFrame('cinematic', 1))
  })

  it('gives every pattern its own color grade, signature decoration, and text treatment', () => {
    expect(new Set(VIDEO_PATTERNS.map(pattern => pattern.filter)).size).toBe(18)
    expect(VIDEO_PATTERNS.map(pattern => pattern.decoration)).toEqual(['letterbox', 'none', 'vignette', 'frame', 'badge', 'grain', 'scanlines', 'polaroid', 'tracking', 'glow', 'halftone', 'blockframe', 'duotone', 'gridline', 'slash', 'shimmer', 'stamp', 'sparkle'])
    expect(VIDEO_PATTERNS.map(pattern => pattern.textStyle)).toEqual(['default', 'default', 'minimal', 'left', 'upper', 'default', 'glow', 'default', 'default', 'minimal', 'upper', 'left', 'minimal', 'glow', 'outline', 'elegant', 'left', 'upper'])
    // Every decoration and text style is exercised by at least one pattern - no dead enum values.
    const decorations: string[] = ['letterbox', 'vignette', 'frame', 'badge', 'none', 'grain', 'scanlines', 'polaroid', 'tracking', 'glow', 'halftone', 'blockframe', 'duotone', 'gridline', 'slash', 'shimmer', 'stamp', 'sparkle']
    for (const decoration of decorations) expect(VIDEO_PATTERNS.some(pattern => pattern.decoration === decoration)).toBe(true)
    const textStyles: string[] = ['default', 'minimal', 'left', 'upper', 'glow', 'outline', 'elegant']
    for (const textStyle of textStyles) expect(VIDEO_PATTERNS.some(pattern => pattern.textStyle === textStyle)).toBe(true)
  })

  it('only flashes on cut for the dynamic pattern, fading out quickly', () => {
    expect(getPatternFrame('dynamic', 0).flashOpacity).toBeGreaterThan(0)
    expect(getPatternFrame('dynamic', 0).flashOpacity).toBeLessThanOrEqual(1)
    expect(getPatternFrame('dynamic', 1).flashOpacity).toBe(0)
    for (const pattern of VIDEO_PATTERNS.map(item => item.id)) { if (pattern !== 'dynamic') expect(getPatternFrame(pattern, 0).flashOpacity).toBe(0) }
  })

  it('scales motion amount with the actual per-image duration, not just its timing curve', () => {
    expect(motionMultiplier(3)).toBe(1)
    expect(motionMultiplier(6)).toBeGreaterThan(1)
    expect(motionMultiplier(1.5)).toBeLessThan(1)
    expect(motionMultiplier(0)).toBe(1)
    expect(motionMultiplier(-5)).toBe(1)
    // Clamped so pathological inputs can't distort the motion into something broken.
    expect(motionMultiplier(1000)).toBeLessThanOrEqual(1.8)
    expect(motionMultiplier(0.001)).toBeGreaterThanOrEqual(.7)

    // The reference duration (3s) reproduces the original tuned values exactly...
    const reference = getPatternFrame('cinematic', .5, 1)
    expect(getPatternFrame('cinematic', .5, 1, 3)).toEqual(reference)
    // ...while a longer hold moves the same pattern further from rest (more zoom), and a shorter
    // one moves it less, without changing where "rest" (scale 1, no offset) sits.
    const longer = getPatternFrame('cinematic', .5, 1, 8)
    const shorter = getPatternFrame('cinematic', .5, 1, 2)
    expect(longer.scale - 1).toBeGreaterThan(reference.scale - 1)
    expect(shorter.scale - 1).toBeLessThan(reference.scale - 1)
    expect(getPatternFrame('cinematic', 0, 1, 8).scale).toBe(1)
  })

  it('raises the minimum seconds per image as the photo count grows', () => {
    expect(minSecondsPerImage(1)).toBe(2)
    expect(minSecondsPerImage(8)).toBe(2)
    expect(minSecondsPerImage(9)).toBe(3)
    expect(minSecondsPerImage(16)).toBe(3)
    expect(minSecondsPerImage(17)).toBe(4)
    expect(minSecondsPerImage(50)).toBe(4)
  })

  it('lowers the maximum seconds per image as the photo count grows, so totals cannot run away', () => {
    expect(maxSecondsPerImage(1)).toBe(8)
    expect(maxSecondsPerImage(8)).toBe(8)
    expect(maxSecondsPerImage(9)).toBe(6)
    expect(maxSecondsPerImage(16)).toBe(6)
    expect(maxSecondsPerImage(17)).toBe(4)
    expect(maxSecondsPerImage(50)).toBe(4)
  })

  it('keeps min at or below max at every photo count', () => {
    for (const count of [1, 8, 9, 16, 17, 50, 200]) expect(minSecondsPerImage(count)).toBeLessThanOrEqual(maxSecondsPerImage(count))
  })
})
