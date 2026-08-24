import type { VercelRequest, VercelResponse } from '@vercel/node'

// A cheap, no-cost way for the client to know which server-configured providers are actually
// usable *before* spending a real (and, for Gemini, billable) request finding out - just reports
// whether the relevant secret exists, never its value. Used to disable buttons up front with a
// concrete reason ("X is not configured on the server") rather than only discovering that after
// a failed attempt.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    ollamaCloud: Boolean(process.env.OLLAMA_CLOUD_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  })
}
