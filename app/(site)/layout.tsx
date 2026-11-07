import { Suspense, ViewTransition } from 'react'
import { Footer } from '@/components/footer'
import { Header, HeaderWithPath } from '@/components/header'
import { RevealObserver } from '@/components/reveal-observer'
import { FALLBACK_NAME } from '@/lib/site'
import { getSettings } from '@/sanity/fetch'

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSettings()
  const name = settings?.photographerName ?? FALLBACK_NAME
  const headerProps = { name, email: settings?.email, instagramHandle: settings?.instagramHandle }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* The active link depends on the URL, which isn't known while prerendering unlisted project pages */}
      <Suspense fallback={<Header {...headerProps} pathname={null} />}>
        <HeaderWithPath {...headerProps} />
      </Suspense>
      <ViewTransition>
        <main id="main">{children}</main>
      </ViewTransition>
      <Footer name={name} role={settings?.role} email={settings?.email} instagramUrl={settings?.instagramUrl} />
      <RevealObserver />
    </>
  )
}
