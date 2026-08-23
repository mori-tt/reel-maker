import { describe, expect, it, vi } from 'vitest'
import { chromeAiAvailabilityMessage, generateChromeAiCopy, getChromeAiAvailability, getChromeLanguageModel, prepareChromeAi } from './chrome-ai'

describe('Chrome built-in AI', () => {
  it('reports unavailable when LanguageModel is absent', async () => {
    expect(getChromeLanguageModel({} as typeof globalThis)).toBeNull()
    await expect(getChromeAiAvailability(null)).resolves.toBe('unavailable')
  })

  it('explains model download states', () => {
    expect(chromeAiAvailabilityMessage('downloadable')).toContain('ダウンロード')
    expect(chromeAiAvailabilityMessage('unavailable')).toContain('利用できません')
  })

  it('downloads and initializes the model when it is downloadable', async () => {
    const destroy = vi.fn()
    const availability = vi.fn().mockResolvedValueOnce('downloadable' as const).mockResolvedValueOnce('available' as const)
    const create = vi.fn().mockResolvedValue({ prompt: vi.fn(), destroy })
    await expect(prepareChromeAi({ api: { availability, create } })).resolves.toBe('available')
    expect(create).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('sends the image with a Japanese prompt and parses structured output', async () => {
    const destroy = vi.fn()
    const prompt = vi.fn().mockResolvedValue('{"title":"光のある午後","cta":"続きを見てみる"}')
    const api = {
      availability: vi.fn().mockResolvedValue('available' as const),
      create: vi.fn().mockResolvedValue({ prompt, destroy }),
    }
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiCopy({ image, direction: '静かに', api })).resolves.toEqual({ title: '光のある午後', cta: '続きを見てみる' })
    expect(api.availability).toHaveBeenCalledWith(expect.objectContaining({ expectedInputs: expect.arrayContaining([{ type: 'image' }]) }))
    expect(prompt).toHaveBeenCalledWith([
      expect.objectContaining({ role: 'user', content: expect.arrayContaining([{ type: 'image', value: image }]) }),
    ], expect.objectContaining({ responseConstraint: expect.objectContaining({ type: 'object' }) }))
    expect(destroy).toHaveBeenCalled()
  })
})
