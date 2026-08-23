import { describe, expect, it } from 'vitest'
import { VIDEO_PATTERNS, getFrameState, getMimeType, getPatternFrame, getVideoPattern, isVideoPatternId, moveItem } from './reel'

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

  it('provides all five selectable video patterns', () => {
    expect(VIDEO_PATTERNS.map(pattern => pattern.id)).toEqual(['cinematic', 'dynamic', 'minimal', 'album', 'social'])
    expect(new Set(VIDEO_PATTERNS.map(pattern => pattern.accent)).size).toBe(5)
    expect(getVideoPattern('social').name).toBe('SNSトレンド')
  })

  it('validates stored pattern ids and falls back safely', () => {
    expect(isVideoPatternId('album')).toBe(true)
    expect(isVideoPatternId('unknown')).toBe(false)
    expect(isVideoPatternId(null)).toBe(false)
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
