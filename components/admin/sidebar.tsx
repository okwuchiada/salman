'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminThemeToggle } from './admin-theme'

const CONTENT = [
  { href: '/admin', label: 'Projects', match: (p: string) => p === '/admin' || p.startsWith('/admin/projects') },
  { href: '/admin/categories', label: 'Categories' },
]
const PAGES = [
  { href: '/admin/home', label: 'Home page' },
  { href: '/admin/about', label: 'About page' },
  { href: '/admin/contact', label: 'Contact details' },
]

export function Sidebar({ siteName, editorName }: { siteName: string; editorName: string }) {
  const pathname = usePathname()
  const current = (item: { href: string; match?: (p: string) => boolean }) =>
    (item.match ? item.match(pathname) : pathname === item.href) ? 'page' : undefined

  return (
    <aside className="side">
      <div className="side-brand">
        <b>{siteName}</b>
        <span className="label">Editor</span>
      </div>
      <nav className="side-group" aria-label="Content">
        <span className="side-label">Content</span>
        {CONTENT.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item)}>
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="side-group" aria-label="Pages">
        <span className="side-label">Pages</span>
        {PAGES.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item)}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <a href="/" target="_blank" rel="noopener noreferrer">
          View site ↗
        </a>
        <AdminThemeToggle />
        <form action="/api/auth/logout" method="post">
          <button className="side-btn" type="submit">
            Sign out <span>{editorName.split(' ')[0]}</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
