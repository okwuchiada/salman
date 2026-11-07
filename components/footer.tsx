import Link from 'next/link'
import { NAV } from './nav'

export function Footer({
  name,
  role,
  email,
  instagramUrl,
}: {
  name: string
  role?: string | null
  email?: string | null
  instagramUrl?: string | null
}) {
  return (
    <div className="wrap">
      <footer className="ftr">
        <div style={{ gridColumn: '1 / span 4', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link className="wordmark" href="/">
            {name}
          </Link>
          {role && <p className="caption">{role}</p>}
        </div>
        <nav className="ftr-nav" style={{ gridColumn: '6 / span 4' }} aria-label="Footer">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ gridColumn: '10 / span 3', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {instagramUrl && (
            <a className="link caption" href={instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram ↗
            </a>
          )}
          {email && (
            <a className="caption" href={`mailto:${email}`} style={{ textDecoration: 'none' }}>
              {email}
            </a>
          )}
        </div>
        <p className="caption num" style={{ gridColumn: '1 / -1' }}>
          © {name}. All photographs © the artist.
        </p>
      </footer>
    </div>
  )
}
