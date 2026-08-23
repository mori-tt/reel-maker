import { describe, expect, it, vi } from 'vitest'
import { normalizeImageFile } from './image'

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
    expect(convert).toHaveBeenCalledWith({ blob: file, type: 'image/jpeg', quality: .9 })
  })

  it('includes the filename and decoder error when conversion fails', async () => {
    const file = new File(['heic'], 'broken.HEIC', { type: 'image/heic' })
    const convert = vi.fn().mockRejectedValue(new Error('unsupported codec'))
    await expect(normalizeImageFile(file, convert)).rejects.toThrow('broken.HEICのHEIC変換に失敗しました: unsupported codec')
  })
})
