import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="wrap section">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
        <p className="label">Page not found</p>
        <h1 className="d t-1">
          This frame is <i>empty.</i>
        </h1>
        <p className="body">The page you were looking for has moved or no longer exists.</p>
        <Link className="arrow" href="/work" style={{ alignSelf: 'flex-start' }}>
          <span>See the work</span>
          <b aria-hidden="true">→</b>
        </Link>
      </div>
    </section>
  )
}
