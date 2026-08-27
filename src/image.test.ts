import { describe, expect, it, vi } from 'vitest'
import { computeAutoEnhanceFilter, normalizeImageFile } from './image'

function solidPixels(r: number, g: number, b: number, count = 25): number[] {
  const pixels: number[] = []
  for (let i = 0; i < count; i++) pixels.push(r, g, b, 255)
  return pixels
}

describe('image normalization', () => {
  it('returns non-HEIC files without conversion', async () => {
    const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
    const convert = vi.fn()
    await expect(normalizeImageFile(file, convert)).resolves.toBe(file)
    expect(convert).not.toHaveBeenCalled()
  })

  it('converts HEIC to a non-empty JPEG blob', async () => {
    const file = new File(['heic'], 'photo.HEIC', { type: 'image/heic' })
    const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' })
    const convert = vi.fn().mockResolvedValue(jpeg)
    await expect(normalizeImageFile(file, convert)).resolves.toBe(jpeg)
    expect(convert).toHaveBeenCalledWith({ blob: file, type: 'image/jpeg', quality: .95 })
  })

  it('includes the filename and decoder error when conversion fails', async () => {
    const file = new File(['heic'], 'broken.HEIC', { type: 'image/heic' })
    const convert = vi.fn().mockRejectedValue(new Error('unsupported codec'))
    await expect(normalizeImageFile(file, convert)).rejects.toThrow('broken.HEICのHEIC変換に失敗しました: unsupported codec')
  })
})

describe('auto-enhance filter', () => {
  const parse = (filter: string) => Object.fromEntries([...filter.matchAll(/(\w+)\(([\d.]+)\)/g)].map(([, key, value]) => [key, Number(value)]))

  it('leaves a well-exposed, full-range image close to untouched', () => {
    const pixels = [...solidPixels(20, 20, 20, 10), ...solidPixels(235, 235, 235, 10), ...solidPixels(128, 128, 128, 10)]
    const { contrast, brightness } = parse(computeAutoEnhanceFilter(pixels))
    expect(contrast).toBeCloseTo(1, 1)
    expect(brightness).toBeCloseTo(1, 1)
  })

  it('brightens a dark, underexposed image', () => {
    const { brightness } = parse(computeAutoEnhanceFilter(solidPixels(20, 18, 22, 25)))
    expect(brightness).toBeGreaterThan(1)
  })

  it('darkens a bright, overexposed image', () => {
    const { brightness } = parse(computeAutoEnhanceFilter(solidPixels(240, 238, 235, 25)))
    expect(brightness).toBeLessThan(1)
  })

  it('boosts contrast for a flat, low-range image', () => {
    const { contrast } = parse(computeAutoEnhanceFilter([...solidPixels(120, 120, 120, 15), ...solidPixels(140, 140, 140, 15)]))
    expect(contrast).toBeGreaterThan(1)
  })

  it('caps both adjustments so no image gets an extreme correction', () => {
    const dark = parse(computeAutoEnhanceFilter(solidPixels(2, 2, 2, 25)))
    expect(dark.brightness).toBeLessThanOrEqual(2)
    const flat = parse(computeAutoEnhanceFilter(solidPixels(128, 128, 128, 25)))
    expect(flat.contrast).toBeLessThanOrEqual(1.35)
  })

  it('never lets brightness push the existing brightest pixel past 255 (no blown-out highlights)', () => {
    // average is very low (dark scene) but max is already fairly high (some real highlight) -
    // brightness should be reined in by that highlight, not just chase the dark average.
    const pixels = [...solidPixels(5, 5, 5, 24), ...solidPixels(200, 200, 200, 1)]
    const { brightness } = parse(computeAutoEnhanceFilter(pixels))
    expect(brightness).toBeLessThanOrEqual(255 / 200 + .01)
  })

  it('actually raises average luminance for a dark photo end to end, instead of contrast canceling brightness out', () => {
    // Regression test: applying contrast() (which stretches around a fixed 128 midpoint) before
    // brightness() pulls anything below 128 even further down, so a naive ordering can make a dark
    // photo's *combined* filter barely brighter than the original, or even darker. Simulates the
    // filter numerically the same way the browser composes them (left to right).
    const pixels = solidPixels(40, 38, 42, 25)
    const filter = computeAutoEnhanceFilter(pixels)
    const { brightness, contrast } = parse(filter)
    expect(filter.indexOf('brightness')).toBeLessThan(filter.indexOf('contrast'))
    let value = 40
    if (filter.startsWith('brightness')) { value *= brightness; value = (value - 128) * contrast + 128 } else { value = (value - 128) * contrast + 128; value *= brightness }
    expect(value).toBeGreaterThan(40)
  })

  it('always includes a mild, fixed saturation lift', () => {
    expect(computeAutoEnhanceFilter(solidPixels(100, 100, 100, 25))).toContain('saturate(1.08)')
  })

  it('falls back to a neutral filter for empty pixel data', () => {
    expect(computeAutoEnhanceFilter([])).toBe('brightness(1) contrast(1) saturate(1.05)')
  })
})
