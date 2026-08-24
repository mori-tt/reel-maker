import { describe, expect, it, vi } from 'vitest'
import { chromeAiAvailabilityMessage, generateChromeAiCaption, generateChromeAiCopy, generateChromeAiFocalPoint, generateChromeAiStyle, getChromeAiAvailability, getChromeLanguageModel, prepareChromeAi } from './chrome-ai'

describe('Chrome built-in AI', () => {
  it('reports a distinct no-api status when LanguageModel is absent (e.g. Safari/Firefox)', async () => {
    expect(getChromeLanguageModel({} as typeof globalThis)).toBeNull()
    await expect(getChromeAiAvailability(null)).resolves.toBe('no-api')
  })

  it('explains model download states in the selected language', () => {
    expect(chromeAiAvailabilityMessage('downloadable')).toContain('ダウンロード')
    expect(chromeAiAvailabilityMessage('unavailable')).toContain('利用できません')
    expect(chromeAiAvailabilityMessage('available', 'en')).toContain('available')
    expect(chromeAiAvailabilityMessage('available', 'en')).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
  })

  it('tells non-Chromium browsers this feature does not exist there and offers the Ollama alternative', () => {
    expect(chromeAiAvailabilityMessage('no-api', 'ja')).toContain('Safari')
    expect(chromeAiAvailabilityMessage('no-api', 'ja')).toContain('Ollama')
    expect(chromeAiAvailabilityMessage('no-api', 'en')).toContain('Safari')
    expect(chromeAiAvailabilityMessage('no-api', 'en')).toContain('Ollama')
  })

  it('surfaces the no-api message (not the generic one) when generating copy without the API', async () => {
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiCopy({ image, language: 'ja' })).rejects.toThrow('Safari')
  })

  it('downloads and initializes the model when it is downloadable', async () => {
    const destroy = vi.fn()
    const availability = vi.fn().mockResolvedValueOnce('downloadable' as const).mockResolvedValueOnce('available' as const)
    const create = vi.fn().mockResolvedValue({ prompt: vi.fn(), destroy })
    await expect(prepareChromeAi({ api: { availability, create } })).resolves.toBe('available')
    expect(create).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('sends the image with a localized prompt and parses structured output', async () => {
    const destroy = vi.fn()
    const prompt = vi.fn().mockResolvedValue('{"title":"光のある午後","cta":"続きを見てみる"}')
    const api = {
      availability: vi.fn().mockResolvedValue('available' as const),
      create: vi.fn().mockResolvedValue({ prompt, destroy }),
    }
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiCopy({ image, direction: 'Quiet and warm', language: 'en', api })).resolves.toEqual({ title: '光のある午後', cta: '続きを見てみる' })
    expect(api.availability).toHaveBeenCalledWith(expect.objectContaining({ expectedInputs: expect.arrayContaining([{ type: 'image' }]) }))
    expect(prompt).toHaveBeenCalledWith([
      expect.objectContaining({ role: 'user', content: expect.arrayContaining([{ type: 'image', value: image }]) }),
    ], expect.objectContaining({ responseConstraint: expect.objectContaining({ type: 'object' }) }))
    expect(destroy).toHaveBeenCalled()
  })

  it('generates a whole-post caption tailored to the given platform', async () => {
    const destroy = vi.fn()
    const prompt = vi.fn().mockResolvedValue('{"caption":"海辺の午後","hashtags":["travel","japan"]}')
    const api = { availability: vi.fn().mockResolvedValue('available' as const), create: vi.fn().mockResolvedValue({ prompt, destroy }) }
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiCaption({ image, platform: 'instagram', title: '海辺の一日', language: 'ja', api })).resolves.toEqual({ caption: '海辺の午後', hashtags: ['#travel', '#japan'] })
    expect(prompt).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ responseConstraint: expect.objectContaining({ properties: expect.objectContaining({ hashtags: expect.anything() }) }) }))
    expect(destroy).toHaveBeenCalled()
  })

  it('surfaces the no-api message when generating a caption without the API', async () => {
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiCaption({ image, platform: 'tiktok', language: 'ja' })).rejects.toThrow('Ollama')
  })

  it('detects a subject position for the focal point feature, a non-copywriting use of the same vision model', async () => {
    const destroy = vi.fn()
    const prompt = vi.fn().mockResolvedValue('{"cell":"middle-right"}')
    const api = { availability: vi.fn().mockResolvedValue('available' as const), create: vi.fn().mockResolvedValue({ prompt, destroy }) }
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiFocalPoint({ image, language: 'ja', api })).resolves.toEqual({ x: .8, y: .5 })
    expect(prompt).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ responseConstraint: expect.objectContaining({ properties: expect.objectContaining({ cell: expect.anything() }) }) }))
    expect(destroy).toHaveBeenCalled()
  })

  it('suggests a motion/color style for the design-assist feature, constrained to the known pattern catalog', async () => {
    const destroy = vi.fn()
    const prompt = vi.fn().mockResolvedValue('{"patternId":"luxury"}')
    const api = { availability: vi.fn().mockResolvedValue('available' as const), create: vi.fn().mockResolvedValue({ prompt, destroy }) }
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiStyle({ image, language: 'ja', api })).resolves.toEqual({ patternId: 'luxury' })
    expect(prompt).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ responseConstraint: expect.objectContaining({ properties: expect.objectContaining({ patternId: expect.objectContaining({ enum: expect.arrayContaining(['luxury', 'kawaii', 'cinematic']) }) }) }) }))
    expect(destroy).toHaveBeenCalled()
  })

  it('surfaces the no-api message when suggesting a style without the API', async () => {
    const image = new Blob(['image'], { type: 'image/jpeg' })
    await expect(generateChromeAiStyle({ image, language: 'ja' })).rejects.toThrow('Ollama')
  })
})
