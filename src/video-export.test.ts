import { describe, expect, it } from 'vitest'
import { PREFERRED_VIDEO_CODECS, pickVideoCodec, totalFrameCount } from './video-export'

describe('video export frame math', () => {
  it('computes an exact frame count from duration and fps', () => {
    expect(totalFrameCount(3, 60)).toBe(180)
    expect(totalFrameCount(3, 30)).toBe(90)
    expect(totalFrameCount(0, 30)).toBe(0)
    expect(totalFrameCount(-1, 30)).toBe(0)
  })

  it('rounds fractional durations to the nearest whole frame', () => {
    expect(totalFrameCount(2.501, 30)).toBe(75)
  })
})

describe('video codec selection', () => {
  it('prefers avc for maximum compatibility, before vp9/av1', () => {
    expect(PREFERRED_VIDEO_CODECS[0]).toBe('avc')
    expect(PREFERRED_VIDEO_CODECS).toContain('vp9')
    expect(PREFERRED_VIDEO_CODECS).toContain('av1')
  })

  it('asks the browser about every preferred codec at the target size/bitrate', async () => {
    const seen: unknown[] = []
    const check = async (codecs: string[], options: { width: number; height: number; bitrate: number }) => { seen.push([codecs, options]); return 'avc' as const }
    await pickVideoCodec(1080, 1920, 16_000_000, undefined, check as never)
    expect(seen).toEqual([[['avc', 'vp9', 'av1'], { width: 1080, height: 1920, bitrate: 16_000_000 }]])
  })

  it('returns null so callers can fall back when no codec is encodable', async () => {
    const check = async () => null
    await expect(pickVideoCodec(1080, 1920, 16_000_000, undefined, check as never)).resolves.toBeNull()
  })
})
