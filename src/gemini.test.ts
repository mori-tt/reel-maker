import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchServerConfig, generateGeminiImage, parseGeminiImageResponse } from './gemini'

// A 1x1 transparent PNG, base64-encoded - just needs to be valid base64 that decodes to *some*
// bytes; nothing in this file's logic inspects the actual image content.
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('Gemini image response parsing', () => {
  it('extracts an inline image part from a successful response', () => {
    const result = parseGeminiImageResponse({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: TINY_PNG_BASE64 } }] } }] })
    expect(result.mimeType).toBe('image/png')
    expect(result.blob.type).toBe('image/png')
    expect(result.blob.size).toBeGreaterThan(0)
  })

  it('skips a leading text part and still finds the image part after it', () => {
    const result = parseGeminiImageResponse({ candidates: [{ content: { parts: [{ text: 'Here you go:' }, { inlineData: { mimeType: 'image/jpeg', data: TINY_PNG_BASE64 } }] } }] })
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('defaults to image/png when the response omits a mime type', () => {
    const result = parseGeminiImageResponse({ candidates: [{ content: { parts: [{ inlineData: { data: TINY_PNG_BASE64 } }] } }] })
    expect(result.mimeType).toBe('image/png')
  })

  it('rejects a text-only response with a localized, actionable message', () => {
    expect(() => parseGeminiImageResponse({ candidates: [{ content: { parts: [{ text: 'I cannot create that image.' }] } }] }, 'en')).toThrow(/decline/i)
    expect(() => parseGeminiImageResponse({ candidates: [{ content: { parts: [{ text: '対応できません' }] } }] }, 'ja')).toThrow('拒否')
  })

  it('rejects a response with no candidates at all instead of crashing on undefined access', () => {
    expect(() => parseGeminiImageResponse({})).toThrow()
    expect(() => parseGeminiImageResponse({ candidates: [] })).toThrow()
  })
})

describe('Gemini network calls', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('posts the prompt as a text-only content part and returns the generated image', async () => {
    const fetchMock = vi.fn(async (_url: string, _options?: RequestInit) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: TINY_PNG_BASE64 } }] } }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await generateGeminiImage({ prompt: 'a minimalist beige background', language: 'en' })
    expect(result.mimeType).toBe('image/png')
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.contents[0].parts).toEqual([{ text: 'a minimalist beige background' }])
  })

  it('surfaces the proxy error (e.g. missing GEMINI_API_KEY) instead of a bare status code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), { status: 503 })))
    await expect(generateGeminiImage({ prompt: 'anything', language: 'en' })).rejects.toThrow('GEMINI_API_KEY is not configured.')
  })
})

describe('fetchServerConfig', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('reports which provider keys are configured server-side', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ollamaCloud: true, gemini: false }), { status: 200 })))
    await expect(fetchServerConfig()).resolves.toEqual({ ollamaCloud: true, gemini: false })
  })

  it('rejects on a non-ok response rather than silently returning an empty config', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))
    await expect(fetchServerConfig()).rejects.toThrow('500')
  })
})
