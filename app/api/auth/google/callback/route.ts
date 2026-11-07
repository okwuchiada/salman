import { decodeIdToken } from 'arctic'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { isAllowedEditor } from '@/lib/auth/editors'
import { GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, googleClient } from '@/lib/auth/google'
import { loginPath } from '@/lib/auth/login-path'
import { getSession } from '@/lib/auth/session'

type GoogleClaims = { email?: string; email_verified?: boolean; name?: string; picture?: string }

/**
 * Google redirects here after sign-in (through the private address, see proxy.ts).
 * Only allowlisted, verified addresses get a session.
 */
export async function GET(request: NextRequest) {
  const login = loginPath()
  if (!login) notFound()

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const jar = await cookies()
  const savedState = jar.get(GOOGLE_STATE_COOKIE)?.value
  const verifier = jar.get(GOOGLE_VERIFIER_COOKIE)?.value
  jar.delete(GOOGLE_STATE_COOKIE)
  jar.delete(GOOGLE_VERIFIER_COOKIE)

  if (!code || !state || !savedState || !verifier || state !== savedState) {
    redirect(`${login}?error=expired`)
  }

  let claims: GoogleClaims
  try {
    // The ID token comes straight from Google's token endpoint over TLS, so it can be decoded directly.
    const tokens = await googleClient().validateAuthorizationCode(code, verifier)
    claims = decodeIdToken(tokens.idToken()) as GoogleClaims
  } catch (err) {
    console.error('[auth] Google sign-in failed', err)
    redirect(`${login}?error=failed`)
  }

  if (!claims.email || claims.email_verified !== true || !isAllowedEditor(claims.email)) {
    redirect(`${login}?error=not-allowed`)
  }

  const session = await getSession()
  session.email = claims.email
  session.name = claims.name ?? claims.email
  session.picture = claims.picture
  await session.save()

  redirect('/admin')
}
