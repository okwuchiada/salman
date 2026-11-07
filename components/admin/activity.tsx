'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type Track = <T>(work: Promise<T>) => Promise<T>

const ActivityContext = createContext<Track | null>(null)

/**
 * Marks a request to Sanity as in progress so the editor's loading bar shows:
 *   const track = useActivity()
 *   const result = await track(saveDraft(...))
 */
export function useActivity(): Track {
  const track = useContext(ActivityContext)
  if (!track) throw new Error('useActivity must be used inside <ActivityProvider>.')
  return track
}

/**
 * One thin loading bar along the top of the editor, shown while any tracked
 * request is running. CSS delays it by 150ms so quick saves never flicker.
 */
export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState(0)

  const track = useCallback<Track>(async (work) => {
    setRunning((n) => n + 1)
    try {
      return await work
    } finally {
      setRunning((n) => Math.max(0, n - 1))
    }
  }, [])

  const active = running > 0
  return (
    <ActivityContext.Provider value={track}>
      <div className="activity" data-active={active || undefined} aria-hidden="true">
        <span />
      </div>
      <span className="visually-hidden" role="status" aria-live="polite">
        {active ? 'Working…' : ''}
      </span>
      {children}
    </ActivityContext.Provider>
  )
}

/** A small spinner for buttons and status text. Decorative: the text says what's happening. */
export function Spinner() {
  return <span className="spin" aria-hidden="true" />
}
