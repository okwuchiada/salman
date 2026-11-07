import 'server-only'
import { Google } from 'arctic'
import { siteUrl } from '@/lib/site'
import { loginPath } from './login-path'

export const GOOGLE_STATE_COOKIE = 'qf_google_state'
export const GOOGLE_VERIFIER_COOKIE = 'qf_google_verifier'

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && loginPath())
}

/** Google redirects back to the private address, e.g. https://site.com/enter-abc123/google/callback */
export function googleRedirectUri() {
  return `${siteUrl}${loginPath()}/google/callback`
}

export function googleClient() {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret || !loginPath()) throw new Error('Google sign-in is not configured.')
  return new Google(id, secret, googleRedirectUri())
}
