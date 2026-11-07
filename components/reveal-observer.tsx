'use client'

import { useEffect } from 'react'

/**
 * One observer for the whole site. Any element with `data-reveal` gets
 * `data-shown` when it scrolls into view, which starts its animation in
 * globals.css (and respects reduced motion).
 *
 * The reveal replays every time: once an element is completely off screen,
 * `data-shown` is removed so it animates again on the way back in. This also
 * covers returning to a page, because Next.js keeps visited pages alive
 * (React <Activity>) and hides them with display: none, which counts as
 * off screen.
 *
 * `data-shown` is an attribute React never touches, so re-renders can't wipe it.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-shown', ''))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
            entry.target.setAttribute('data-shown', '')
          } else if (!entry.isIntersecting) {
            // Fully out of view: reset so it reveals again next time.
            entry.target.removeAttribute('data-shown')
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: [0, 0.08] },
    )

    const watched = new WeakSet<Element>()
    const watch = (el: Element) => {
      if (watched.has(el)) return
      watched.add(el)
      io.observe(el)
    }
    const scan = (root: ParentNode) => root.querySelectorAll('[data-reveal]').forEach(watch)

    scan(document)
    // Pick up content that arrives later: navigation, filtering, streaming.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches('[data-reveal]')) watch(node)
            scan(node)
          }
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
