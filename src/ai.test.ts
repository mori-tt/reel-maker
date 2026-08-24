import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCaptionPrompt, buildCopyPrompt, buildFocalPointPrompt, buildStylePrompt, getLocalOllamaCandidates, isHeicFile, listOllamaModels, normalizeOllamaUrl, parseAiCaption, parseAiCopy, parseAiFocalPoint, parseAiStyleSuggestion, selectVisionModel, supportsVision } from './ai'

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

describe('AI focal point detection', () => {
  it('maps a grid cell response to its approximate normalized position', () => {
    expect(parseAiFocalPoint('{"cell":"top-left"}')).toEqual({ x: .2, y: .2 })
    expect(parseAiFocalPoint('{"cell":"bottom-right"}')).toEqual({ x: .8, y: .8 })
    expect(parseAiFocalPoint('{"cell":"center"}')).toEqual({ x: .5, y: .5 })
  })

  it('is tolerant of case and surrounding whitespace in the cell label', () => {
    expect(parseAiFocalPoint('{"cell":" Top-Left "}')).toEqual({ x: .2, y: .2 })
  })

  it('parses JSON even when the model wraps it in a markdown fence', () => {
    expect(parseAiFocalPoint('```json\n{"cell":"middle-right"}\n```')).toEqual({ x: .8, y: .5 })
  })

  it('falls back to raw x/y coordinates if a model ignores the grid instruction', () => {
    expect(parseAiFocalPoint('{"x":0.3,"y":0.65}')).toEqual({ x: 0.3, y: 0.65 })
    expect(parseAiFocalPoint('{"x":1.4,"y":-0.2}')).toEqual({ x: 1, y: 0 })
  })

  it('rejects a response with neither a valid cell nor usable numeric coordinates', () => {
    expect(() => parseAiFocalPoint('{"cell":"somewhere-vague"}')).toThrow('位置情報')
    expect(() => parseAiFocalPoint('{"caption":"hello"}')).toThrow('位置情報')
  })

  it('builds a prompt that asks for a grid cell, not marketing copy', () => {
    const ja = buildFocalPointPrompt('ja')
    expect(ja).toContain('被写体')
    expect(ja).toMatch(/\{"cell"/)
    const en = buildFocalPointPrompt('en')
    expect(en).toContain('subject')
    expect(en).toContain('grid')
    expect(en).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
  })
})

describe('AI style suggestion', () => {
  it('accepts any valid pattern id from the full 18-pattern catalog', () => {
    expect(parseAiStyleSuggestion('{"patternId":"cinematic"}')).toEqual({ patternId: 'cinematic' })
    expect(parseAiStyleSuggestion('{"patternId":"kawaii"}')).toEqual({ patternId: 'kawaii' })
    expect(parseAiStyleSuggestion('{"patternId":"luxury"}')).toEqual({ patternId: 'luxury' })
  })

  it('is tolerant of surrounding whitespace and a markdown fence', () => {
    expect(parseAiStyleSuggestion('```json\n{"patternId":" retrowave "}\n```')).toEqual({ patternId: 'retrowave' })
  })

  it('rejects an id outside the known pattern catalog rather than silently accepting it', () => {
    expect(() => parseAiStyleSuggestion('{"patternId":"studio-ghibli"}')).toThrow('スタイル')
    expect(() => parseAiStyleSuggestion('{"cell":"top-left"}')).toThrow('スタイル')
  })

  it('builds a prompt listing every pattern id as a design choice, not a copywriting task', () => {
    const ja = buildStylePrompt('ja')
    expect(ja).toContain('デザインアシスタント')
    expect(ja).toContain('cinematic:')
    expect(ja).toContain('kawaii:')
    expect(ja).toMatch(/\{"patternId"/)
    const en = buildStylePrompt('en')
    expect(en).toContain('design assistant')
    expect(en).toContain('cinematic:')
    expect(en).not.toMatch(/[ぁ-んァ-ヶ一-龠々ー]/)
  })
})

describe('listOllamaModels error handling', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  // The /api/ollama proxy returns a specific, actionable reason (e.g. a missing server-side API
  // key) as JSON - surfacing that beats a bare "models (503)" status code, especially since this
  // is exactly what tells a user *why* the Ollama Cloud button can't be used yet.
  it('surfaces a JSON error body from the proxy instead of just the status code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'OLLAMA_CLOUD_API_KEY is not configured.' }), { status: 503 })))
    await expect(listOllamaModels('https://example.com', 'ollama-cloud', undefined, 'en')).rejects.toThrow('OLLAMA_CLOUD_API_KEY is not configured.')
  })

  it('falls back to raw text when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Service Unavailable', { status: 503 })))
    await expect(listOllamaModels('http://localhost:11434', 'ollama-local', undefined, 'en')).rejects.toThrow('Service Unavailable')
  })

  it('falls back to just the status code when there is no error body at all', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))
    await expect(listOllamaModels('http://localhost:11434', 'ollama-local', undefined, 'en')).rejects.toThrow('(500)')
  })

  it('returns the model list on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), { status: 200 })))
    await expect(listOllamaModels('http://localhost:11434')).resolves.toEqual([{ name: 'gemma3:4b' }])
  })
})
