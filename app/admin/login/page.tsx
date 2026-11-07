import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { googleConfigured } from '@/lib/auth/google'
import { loginPath } from '@/lib/auth/login-path'

export const metadata: Metadata = { title: 'Sign in' }

const MESSAGES: Record<string, string> = {
  'not-allowed': 'That Google account isn’t on the list of editors. Ask the site owner to add your address.',
  expired: 'The sign-in took too long or was interrupted. Please try again.',
  failed: 'Google sign-in didn’t complete. Please try again.',
  'not-configured': 'Google sign-in hasn’t been set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the site’s environment.',
}

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" aria-hidden="true">
    <path fill="currentColor" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z" />
    <path fill="currentColor" opacity=".85" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.9.9-3.1.9-2.3 0-4.3-1.6-5-3.8H1v2.3A9 9 0 0 0 9 18Z" />
    <path fill="currentColor" opacity=".7" d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3Z" />
    <path fill="currentColor" opacity=".55" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 1 5l3 2.3c.7-2.1 2.7-3.7 5-3.7Z" />
  </svg>
)

function SignInButton({ href }: { href: string }) {
  return (
    <a className="google" href={href}>
      <GoogleIcon />
      Sign in with Google
    </a>
  )
}

/** Request-time part: the message from the last attempt, and whether Google is set up. */
async function SignIn({ searchParams }: { searchParams: PageProps<'/admin/login'>['searchParams'] }) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? MESSAGES[params.error] : undefined
  const signedOut = params['signed-out'] === '1'
  const ready = googleConfigured()
  const start = `${loginPath()}/google`
  return (
    <>
      {error ? (
        <p role="alert" className="error-text">
          {error}
        </p>
      ) : signedOut ? (
        <p role="status">You’re signed out.</p>
      ) : null}
      {ready ? (
        <SignInButton href={start} />
      ) : (
        !error && (
          <p role="alert" className="error-text">
            {MESSAGES['not-configured']}
          </p>
        )
      )}
    </>
  )
}

export default function LoginPage(props: PageProps<'/admin/login'>) {
  return (
    <main className="login">
      <div className="login-card">
        <p className="eyebrow">Editor</p>
        <h1>Sign in to edit the site</h1>
        <p>Use the Google account the site owner added to the list of editors.</p>
        <Suspense fallback={<p aria-busy="true">Loading…</p>}>
          <SignIn searchParams={props.searchParams} />
        </Suspense>
        <Link href="/" className="back">
          ← Back to the site
        </Link>
      </div>
    </main>
  )
}
