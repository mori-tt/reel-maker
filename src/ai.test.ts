import { describe, expect, it } from 'vitest'
import { buildCopyPrompt, isHeicFile, normalizeOllamaUrl, parseAiCopy, selectVisionModel, supportsVision } from './ai'

describe('HEIC support', () => {
  it('recognizes HEIC and HEIF by mime type or extension', () => {
    expect(isHeicFile({ name: 'photo.HEIC', type: '' })).toBe(true)
    expect(isHeicFile({ name: 'photo', type: 'image/heif' })).toBe(true)
    expect(isHeicFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false)
  })
})

describe('Ollama helpers', () => {
  it('normalizes the server URL without a trailing slash', () => {
    expect(normalizeOllamaUrl(' http://localhost:11434/// ')).toBe('http://localhost:11434')
  })

  it('parses JSON even when the model wraps it in a markdown fence', () => {
    const response = '```json\n{"title":"海辺の一日","cta":"次の旅へ"}\n```'
    expect(parseAiCopy(response)).toEqual({ title: '海辺の一日', cta: '次の旅へ' })
  })

  it('rejects an invalid response contract', () => {
    expect(() => parseAiCopy('{"message":"hello"}')).toThrow('タイトルとCTA')
  })

  it('detects whether an Ollama model accepts images', () => {
    expect(supportsVision({ name: 'vision', capabilities: ['completion', 'vision'] })).toBe(true)
    expect(supportsVision({ name: 'gemma3:4b' })).toBe(true)
    expect(supportsVision({ name: 'gemma4:e2b', capabilities: ['completion', 'tools', 'thinking'] })).toBe(false)
    expect(supportsVision({ name: 'unknown' })).toBe(false)
  })

  it('selects an installed vision model automatically', () => {
    const models = [{ name: 'text-only' }, { name: 'gemma3:4b' }]
    expect(selectVisionModel(models, 'text-only')).toBe('gemma3:4b')
    expect(selectVisionModel(models, 'gemma3:4b')).toBe('gemma3:4b')
  })

  it('includes format, pattern direction and free-form instructions in the prompt', () => {
    const prompt = buildCopyPrompt({ formatName: 'Instagramストーリー', direction: '温かく', customDirection: '押し売り感を出さない' })
    expect(prompt).toContain('Instagramストーリー')
    expect(prompt).toContain('温かく')
    expect(prompt).toContain('押し売り感を出さない')
  })
})
