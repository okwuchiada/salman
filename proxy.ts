import { unsealData } from 'iron-session'
import { NextResponse, type NextRequest } from 'next/server'
import { isAllowedEditor } from '@/lib/auth/editors'
import { loginPath } from '@/lib/auth/login-path'

const SESSION_COOKIE = 'qf_editor'

/** True when the cookie decrypts to an unexpired session for an allowlisted editor. */
async function isEditor(request: NextRequest) {
  const seal = request.cookies.get(SESSION_COOKIE)?.value
  const password = process.env.SESSION_SECRET
  if (!seal || !password) return false
  try {
    const session = await unsealData<{ email?: string }>(seal, { password })
    return isAllowedEditor(session.email)
  } catch {
    return false
  }
}

/**
 * Keeps the editor out of sight.
 *  - The sign-in page and Google sign-in only exist under the private address
 *    in ADMIN_LOGIN_PATH (e.g. /enter-abc123), rewritten to their real routes.
 *  - Their real addresses (/admin/login, /api/auth/google…) always show the 404 page.
 *  - /admin shows the 404 page to anyone without a valid editor session, checked
 *    here (decrypted, unexpired, on the allowlist) before anything renders.
 * This hides the editor; it is not the security boundary. Every editor page,
 * server action and API route still verifies the session and the allowlist.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const secret = loginPath()
  const to = (path: string) => NextResponse.rewrite(new URL(path + search, request.url))
  // Any path with no matching route renders the site's normal not-found page with a 404 status.
  const notFound = () => NextResponse.rewrite(new URL('/__not-found', request.url))

  if (secret) {
    if (pathname === secret) return to('/admin/login')
    if (pathname === `${secret}/google`) return to('/api/auth/google')
    if (pathname === `${secret}/google/callback`) return to('/api/auth/google/callback')
  }

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/') || pathname.startsWith('/api/auth/google')) {
    return notFound()
  }
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && !(await isEditor(request))) {
    return notFound()
  }
  return NextResponse.next()
}

export const config = {
  // Everything except Next's static files and images.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
}
