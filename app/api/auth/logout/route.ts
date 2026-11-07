import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

/**
 * Signs the editor out and returns to the public home page, so the private
 * sign-in address is never revealed. POST only, so a link or image can't sign someone out.
 */
export async function POST(request: Request) {
  const session = await getSession()
  session.destroy()
  // 303 so the browser follows with a GET.
  return NextResponse.redirect(new URL('/', request.url), 303)
}
