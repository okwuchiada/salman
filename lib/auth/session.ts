import 'server-only'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { getIronSession, type SessionOptions } from 'iron-session'

export type EditorSession = {
  email?: string
  name?: string
  picture?: string
}

export const SESSION_COOKIE = 'qf_editor'

function options(): SessionOptions {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters (see .env.local).')
  }
  return {
    cookieName: SESSION_COOKIE,
    password,
    ttl: 60 * 60 * 24 * 7, // one week
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  }
}

/** The encrypted editor session stored in a cookie. Request-time only. */
export async function getSession() {
  // Checking the session's expiry reads the clock, so it must never run during prerendering.
  await connection()
  return getIronSession<EditorSession>(await cookies(), options())
}
