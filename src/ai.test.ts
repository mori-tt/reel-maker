import { describe, expect, it } from 'vitest'
import { buildCaptionPrompt, buildCopyPrompt, getLocalOllamaCandidates, isHeicFile, normalizeOllamaUrl, parseAiCaption, parseAiCopy, selectVisionModel, supportsVision } from './ai'

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

  it('builds a unique preferred-first list of local endpoints', () => {
    expect(getLocalOllamaCandidates('http://127.0.0.1:11434/')).toEqual([
      'http://127.0.0.1:11434',
      'http://localhost:11434',
    ])
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

  it('builds an English-only prompt for the English UI', () => {
    const prompt = buildCopyPrompt({ language: 'en', formatName: 'Instagram Story', direction: 'Warm and concise', customDirection: 'Avoid hard selling' })
    expect(prompt).toContain('English copywriter')
    expect(prompt).toContain('Instagram Story')
    expect(prompt).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
  })
})

describe('post caption + hashtags', () => {
  it('parses a caption response and normalizes hashtags to always have a leading #', () => {
    const response = '{"caption":"海辺の一日を振り返って","hashtags":["旅行","#夏の思い出"," beach "]}'
    expect(parseAiCaption(response)).toEqual({ caption: '海辺の一日を振り返って', hashtags: ['#旅行', '#夏の思い出', '#beach'] })
  })

  it('parses JSON even when the model wraps it in a markdown fence', () => {
    const response = '```json\n{"caption":"hello","hashtags":["a","b"]}\n```'
    expect(parseAiCaption(response)).toEqual({ caption: 'hello', hashtags: ['#a', '#b'] })
  })

  it('tolerates a missing hashtags array instead of throwing', () => {
    expect(parseAiCaption('{"caption":"hello"}')).toEqual({ caption: 'hello', hashtags: [] })
  })

  it('rejects a response with no caption field', () => {
    expect(() => parseAiCaption('{"hashtags":["a"]}')).toThrow('キャプション')
  })

  it('caps hashtag count and caption length so a runaway response cannot break the UI', () => {
    const manyTags = Array.from({ length: 30 }, (_, i) => `tag${i}`)
    const result = parseAiCaption(JSON.stringify({ caption: 'x'.repeat(3000), hashtags: manyTags }))
    expect(result.hashtags.length).toBe(20)
    expect(result.caption.length).toBe(2200)
  })

  it('tailors the prompt style per platform and includes the on-screen title for context', () => {
    const instagram = buildCaptionPrompt({ platform: 'instagram', title: '海辺の一日', language: 'ja' })
    expect(instagram).toContain('instagram')
    expect(instagram).toContain('海辺の一日')
    expect(instagram).toContain('8〜15個')
    const tiktok = buildCaptionPrompt({ platform: 'tiktok', language: 'en' })
    expect(tiktok).toContain('tiktok')
    expect(tiktok).toContain('4-8')
    const youtube = buildCaptionPrompt({ platform: 'youtube', language: 'en', customDirection: 'Mention it was shot on an iPhone' })
    expect(youtube).toContain('youtube')
    expect(youtube).toContain('Mention it was shot on an iPhone')
  })
})
