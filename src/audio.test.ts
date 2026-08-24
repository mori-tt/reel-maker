import { describe, expect, it } from 'vitest'
import { fitChannelDuration } from './audio'

describe('audio duration fitting', () => {
  it('trims a clip longer than the target length', () => {
    const result = fitChannelDuration([1, 2, 3, 4, 5], 3, 0)
    expect(Array.from(result)).toEqual([1, 2, 3])
  })

  it('loops a clip shorter than the target length', () => {
    const result = fitChannelDuration([1, 2, 3], 7, 0)
    expect(Array.from(result)).toEqual([1, 2, 3, 1, 2, 3, 1])
  })

  it('returns exactly the requested length regardless of source length', () => {
    expect(fitChannelDuration([1, 2], 10, 0)).toHaveLength(10)
    expect(fitChannelDuration([1, 2, 3, 4, 5, 6], 2, 0)).toHaveLength(2)
  })

  it('fades the last samples down to silence', () => {
    const result = fitChannelDuration(new Array(10).fill(1), 10, 4)
    expect(Array.from(result.slice(0, 6))).toEqual([1, 1, 1, 1, 1, 1])
    expect(result[6]).toBeCloseTo(1, 5)
    expect(result[7]).toBeCloseTo(.75, 5)
    expect(result[8]).toBeCloseTo(.5, 5)
    expect(result[9]).toBeCloseTo(.25, 5)
  })

  it('never produces a fade longer than the clip itself', () => {
    // fadeSamples (100) exceeds the target length (3), so it's clamped down to 3: the whole clip
    // is inside the fade window instead of throwing or fading past the start.
    const result = fitChannelDuration([1, 1, 1], 3, 100)
    expect(result.every(value => Number.isFinite(value))).toBe(true)
    expect(Array.from(result).map(value => Number(value.toFixed(3)))).toEqual([1, .667, .333])
  })

  it('treats an empty source as silence rather than throwing', () => {
    expect(Array.from(fitChannelDuration([], 4, 0))).toEqual([0, 0, 0, 0])
  })

  it('scales loudness by the volume factor', () => {
    expect(Array.from(fitChannelDuration([1, 1, 1, 1], 4, 0, .5))).toEqual([.5, .5, .5, .5])
    expect(Array.from(fitChannelDuration([1, 1], 2, 0))).toEqual([1, 1])
  })
})
