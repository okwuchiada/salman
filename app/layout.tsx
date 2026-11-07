import type { Metadata } from 'next'
import { Instrument_Serif, Manrope } from 'next/font/google'
import { ThemeScript } from '@/components/theme-script'
import { FALLBACK_NAME, siteUrl } from '@/lib/site'
import { getSettings } from '@/sanity/fetch'
import './globals.css'

const display = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const name = settings?.photographerName ?? FALLBACK_NAME
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${name} · Photography`, template: `%s · ${name}` },
    description: settings?.seoDescription ?? settings?.heroStatement ?? undefined,
    openGraph: { type: 'website', siteName: name },
  }
}

/** Shared document shell for the public site and the editor. */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
