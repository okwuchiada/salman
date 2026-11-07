import { generateCodeVerifier, generateState } from 'arctic'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, googleClient, googleConfigured } from '@/lib/auth/google'
import { loginPath } from '@/lib/auth/login-path'

/** Starts Google sign-in. Only reachable through the private address (see proxy.ts). */
export async function GET() {
  // Must run per request: each sign-in needs its own state and verifier, never a prerendered response.
  await connection()
  const login = loginPath()
  if (!login) notFound()
  if (!googleConfigured()) redirect(`${login}?error=not-configured`)

  const state = generateState()
  const verifier = generateCodeVerifier()
  const url = googleClient().createAuthorizationURL(state, verifier, ['openid', 'email', 'profile'])
  url.searchParams.set('prompt', 'select_account')

  const jar = await cookies()
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10,
  }
  jar.set(GOOGLE_STATE_COOKIE, state, opts)
  jar.set(GOOGLE_VERIFIER_COOKIE, verifier, opts)

  redirect(url.toString())
}
