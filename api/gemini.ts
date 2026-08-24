import type { VercelRequest, VercelResponse } from '@vercel/node'

// Google's Gemini API is the one provider in this app that can actually output new image pixels
// (generation and instruction-based editing) - Chrome's Prompt API and Ollama's vision models can
// only *understand* an image and respond with text, never produce one (see src/gemini.ts). The
// API key stays server-side here, same pattern as api/ollama.ts, and the model name is
// configurable via GEMINI_IMAGE_MODEL in case Google renames/deprecates the default.
const DEFAULT_MODEL = 'gemini-2.5-flash-image'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST is supported.' })
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(req.body),
    })
    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    return res.send(text)
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Gemini upstream request failed.' })
  }
}
