'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NAV } from './nav'
import { ThemeToggle } from './theme-toggle'

type HeaderProps = {
  name: string
  email?: string | null
  instagramHandle?: string | null
}

function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

/** Header shell. `pathname` is null while it is being prerendered without a known URL. */
export function Header({ name, email, instagramHandle, pathname }: HeaderProps & { pathname: string | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = (href: string) => (isCurrent(pathname, href) ? 'page' : undefined)

  return (
    <header className="wrap">
      <div className="hdr">
        <Link className="wordmark" href="/">
          {name}
        </Link>
        <div className="hdr-right">
          <nav className="nav" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} className="nav-link" href={item.href} aria-current={current(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="sheet" id="site-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="sheet-top">
            <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
              {name}
            </Link>
            <button className="menu-btn" type="button" autoFocus onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav className="sheet-links" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={current(item.href)} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {email && <span className="caption">{email}</span>}
            {instagramHandle && <span className="caption">Instagram · {instagramHandle}</span>}
          </div>
        </div>
      )}
    </header>
  )
}

/** Reads the current URL to mark the active link. Render inside <Suspense>. */
export function HeaderWithPath(props: HeaderProps) {
  const pathname = usePathname()
  return <Header {...props} pathname={pathname} />
}
