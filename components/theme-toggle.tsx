'use client'

/**
 * Switches between light and dark and remembers the choice. The label is
 * driven by CSS from <html data-theme>, so server and client markup match.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Storage can be unavailable (private mode); the switch still applies.
    }
  }

  return (
    <button className="tbtn" type="button" onClick={toggle}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
      </svg>
      <span className="to-dark">
        <span className="hide-m">Dark</span>
        <span className="visually-hidden"> mode: switch to dark</span>
      </span>
      <span className="to-light">
        <span className="hide-m">Light</span>
        <span className="visually-hidden"> mode: switch to light</span>
      </span>
    </button>
  )
}
