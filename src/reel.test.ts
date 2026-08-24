import { describe, expect, it } from 'vitest'
import { VIDEO_FORMATS, VIDEO_PATTERNS, VIDEO_QUALITIES, getFrameState, getMimeType, getPatternFrame, getVideoFormat, getVideoPattern, getVideoQuality, isVideoFormatId, isVideoPatternId, isVideoQualityId, moveItem, nextFrameDelayMs } from './reel'

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

  it('provides all five selectable video patterns', () => {
    expect(VIDEO_PATTERNS.map(pattern => pattern.id)).toEqual(['cinematic', 'dynamic', 'minimal', 'album', 'social'])
    expect(new Set(VIDEO_PATTERNS.map(pattern => pattern.accent)).size).toBe(5)
    expect(getVideoPattern('social').name).toEqual({ en: 'Social trend', ja: 'SNSトレンド' })
  })

  it('validates stored pattern ids and falls back safely', () => {
    expect(isVideoPatternId('album')).toBe(true)
    expect(isVideoPatternId('unknown')).toBe(false)
    expect(isVideoPatternId(null)).toBe(false)
  })

  it('provides social formats and quality presets', () => {
    expect(VIDEO_FORMATS.map(format => format.id)).toEqual(['reel', 'story', 'feed-portrait', 'square', 'shorts'])
    expect(getVideoFormat('square')).toMatchObject({ width: 1080, height: 1080 })
    expect(getVideoFormat('story').safeTop).toBeGreaterThan(getVideoFormat('reel').safeTop)
    expect(isVideoFormatId('shorts')).toBe(true)
    expect(isVideoFormatId('landscape')).toBe(false)
    expect(VIDEO_QUALITIES.map(quality => quality.id)).toEqual(['standard', 'high'])
    expect(getVideoQuality('high').fps).toBe(60)
    expect(getVideoQuality('high').bitsPerSecond).toBeGreaterThanOrEqual(40_000_000)
    expect(getVideoQuality('high').bitsPerSecond).toBeGreaterThan(getVideoQuality('standard').bitsPerSecond)
    expect(isVideoQualityId('high')).toBe(true)
    expect(getVideoFormat('reel').name.en).toBe('Instagram Reel')
    expect(getVideoFormat('reel').description.en).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
    expect(getVideoQuality('high').name.ja).toBe('高画質')
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
    expect(new Set(frames.map(frame => `${frame.scale}:${frame.translateX}:${frame.textScale}`)).size).toBe(5)
    expect(getPatternFrame('cinematic', -1)).toEqual(getPatternFrame('cinematic', 0))
    expect(getPatternFrame('cinematic', 2)).toEqual(getPatternFrame('cinematic', 1))
  })
})
