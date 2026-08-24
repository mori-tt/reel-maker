import { describe, expect, it } from 'vitest'
import { fitChannelDuration } from './audio'

describe('audio duration fitting', () => {
  it('trims a clip longer than the target length', () => {
    const result = fitChannelDuration([1, 2, 3, 4, 5], 3, 0, 0)
    expect(Array.from(result)).toEqual([1, 2, 3])
  })

  it('loops a clip shorter than the target length', () => {
    const result = fitChannelDuration([1, 2, 3], 7, 0, 0)
    expect(Array.from(result)).toEqual([1, 2, 3, 1, 2, 3, 1])
  })

  it('returns exactly the requested length regardless of source length', () => {
    expect(fitChannelDuration([1, 2], 10, 0, 0)).toHaveLength(10)
    expect(fitChannelDuration([1, 2, 3, 4, 5, 6], 2, 0, 0)).toHaveLength(2)
  })

  it('fades the first samples up from silence (fade-in), so playback never starts abruptly', () => {
    const result = fitChannelDuration(new Array(10).fill(1), 10, 4, 0)
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(.25, 5)
    expect(result[2]).toBeCloseTo(.5, 5)
    expect(result[3]).toBeCloseTo(.75, 5)
    expect(Array.from(result.slice(4))).toEqual([1, 1, 1, 1, 1, 1])
  })

  it('fades the last samples down to silence (fade-out), so playback never cuts off abruptly', () => {
    const result = fitChannelDuration(new Array(10).fill(1), 10, 0, 4)
    expect(Array.from(result.slice(0, 6))).toEqual([1, 1, 1, 1, 1, 1])
    expect(result[6]).toBeCloseTo(1, 5)
    expect(result[7]).toBeCloseTo(.75, 5)
    expect(result[8]).toBeCloseTo(.5, 5)
    expect(result[9]).toBeCloseTo(.25, 5)
  })

  it('applies fade-in and fade-out together when there is room for both', () => {
    const result = fitChannelDuration(new Array(10).fill(1), 10, 2, 2)
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(.5, 5)
    expect(Array.from(result.slice(2, 8))).toEqual([1, 1, 1, 1, 1, 1])
    expect(result[8]).toBeCloseTo(1, 5)
    expect(result[9]).toBeCloseTo(.5, 5)
  })

  it('never produces a fade longer than the clip itself', () => {
    // fadeOutSamples (100) exceeds the target length (3), so it's clamped down to 3: the whole
    // clip is inside the fade window instead of throwing or fading past the start.
    const result = fitChannelDuration([1, 1, 1], 3, 0, 100)
    expect(result.every(value => Number.isFinite(value))).toBe(true)
    expect(Array.from(result).map(value => Number(value.toFixed(3)))).toEqual([1, .667, .333])
  })

  it('scales fade-in and fade-out down proportionally when together they would exceed the clip', () => {
    // A short clip (5 samples) asked for a 4-sample fade-in AND a 4-sample fade-out (8 total,
    // more than the clip) - both should shrink (to 2 samples each here) rather than overlapping
    // unpredictably or throwing.
    const result = fitChannelDuration(new Array(5).fill(1), 5, 4, 4)
    expect(result.every(value => Number.isFinite(value))).toBe(true)
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[2]).toBeCloseTo(1, 5)
    expect(result[result.length - 1]).toBeLessThan(1)
  })

  it('treats an empty source as silence rather than throwing', () => {
    expect(Array.from(fitChannelDuration([], 4, 0, 0))).toEqual([0, 0, 0, 0])
  })

  it('scales loudness by the volume factor', () => {
    expect(Array.from(fitChannelDuration([1, 1, 1, 1], 4, 0, 0, .5))).toEqual([.5, .5, .5, .5])
    expect(Array.from(fitChannelDuration([1, 1], 2, 0, 0))).toEqual([1, 1])
  })
})
