'use client'

/*
 * Light / dark mode for the editor, kept separate from the public site's theme.
 * The choice is stored in localStorage ("admin-theme") and applied to
 * <html data-admin-theme>; with no choice saved, it follows the device setting.
 */

const KEY = 'admin-theme'

const script = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-admin-theme',t)}catch(e){}})()`

/** Runs before the editor paints, so it never flashes the wrong theme. */
export function AdminThemeScript() {
  return (
    <script
      // On client-side navigation React doesn't run scripts; the attribute is already set by then.
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}

/** Sidebar switch. Its label comes from CSS (<html data-admin-theme>), so server and client markup match. */
export function AdminThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.getAttribute('data-admin-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-admin-theme', next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage can be unavailable (private mode); the switch still applies for this visit.
    }
  }

  return (
    <button className="side-btn theme-btn" type="button" onClick={toggle}>
      <span className="lbl">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
        </svg>
        <span className="to-dark">Dark mode</span>
        <span className="to-light">Light mode</span>
      </span>
    </button>
  )
}
