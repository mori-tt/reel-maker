import { describe, expect, it } from 'vitest'
import { getFrameState, getMimeType, moveItem } from './reel'

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
})
