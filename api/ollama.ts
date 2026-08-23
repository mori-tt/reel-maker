import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_PATHS = new Set(['/api/generate', '/api/tags'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const provider = req.query.provider === 'cloud' ? 'cloud' : 'configured'
  const endpoint = (provider === 'cloud' ? process.env.OLLAMA_CLOUD_BASE_URL || 'https://ollama.com' : process.env.OLLAMA_BASE_URL)?.replace(/\/+$/, '')
  const apiKey = provider === 'cloud' ? process.env.OLLAMA_CLOUD_API_KEY : process.env.OLLAMA_API_KEY
  if (!endpoint) return res.status(503).json({ error: 'Ollama endpoint is not configured.' })
  if (provider === 'cloud' && !apiKey) return res.status(503).json({ error: 'OLLAMA_CLOUD_API_KEY is not configured.' })
  const path = typeof req.query.path === 'string' ? `/${req.query.path.replace(/^\/+/, '')}` : '/api/generate'
  if (!ALLOWED_PATHS.has(path)) return res.status(400).json({ error: 'Unsupported Ollama path.' })
  try {
    const upstream = await fetch(`${endpoint}${path}`, {
      method: req.method === 'GET' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body),
    })
    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    return res.send(text)
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Ollama upstream request failed.' })
  }
}
