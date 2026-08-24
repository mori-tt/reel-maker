import { next } from '@vercel/edge'

// Protects the entire deployment (static app + /api routes) with HTTP Basic
// Auth. Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in the Vercel project's
// environment variables to enable it. See README.md for setup steps.
export const config = { matcher: '/:path*' }

function unauthorized() {
  return new Response('Authentication required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Frameflow", charset="UTF-8"' } })
}

// Constant-time comparison so a wrong guess can't be timed character by character.
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export default function middleware(request: Request) {
  const user = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASSWORD
  if (!user || !password) return new Response('Basic auth is not configured: set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD.', { status: 500 })

  const header = request.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    try {
      const [inputUser, inputPassword] = atob(header.slice(6)).split(':')
      if (timingSafeEqual(inputUser ?? '', user) && timingSafeEqual(inputPassword ?? '', password)) return next()
    } catch { /* malformed header, fall through to 401 */ }
  }
  return unauthorized()
}
