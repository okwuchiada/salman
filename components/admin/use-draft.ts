'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { discardDraft, publishDoc, saveDraft } from '@/app/admin/actions'
import type { DocStatus, EditableType } from '@/lib/admin/types'
import { useActivity } from './activity'
import { useConfirm } from './confirm'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type Notice = { kind: 'ok' | 'error'; text: string; problems?: string[] } | null

const AUTOSAVE_MS = 800

/**
 * Form state for one Sanity document. Changes autosave to the draft shortly
 * after typing stops; publish() saves anything pending, then publishes.
 */
export function useDraft<V extends Record<string, unknown>>(
  type: EditableType,
  id: string,
  initial: V,
  initialStatus: DocStatus,
) {
  const [values, setValues] = useState<V>(initial)
  const [status, setStatus] = useState<DocStatus>(initialStatus)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, startBusy] = useTransition()
  const confirm = useConfirm()
  const track = useActivity()
  const latest = useRef<V>(initial)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    if (!dirty.current) return true
    dirty.current = false
    setSaveState('saving')
    const result = await track(saveDraft(type, id, latest.current))
    if (result.ok) {
      setSaveState('saved')
      setStatus((s) => (s === 'published' ? 'changed' : s))
      return true
    }
    dirty.current = true
    setSaveState('error')
    setNotice({ kind: 'error', text: result.error, problems: result.problems })
    return false
  }, [type, id, track])

  const set = useCallback(
    (patch: Partial<V>) => {
      setValues((prev) => {
        const next = { ...prev, ...patch }
        latest.current = next
        return next
      })
      dirty.current = true
      setNotice(null)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS)
    },
    [flush],
  )

  const publish = useCallback(() => {
    startBusy(async () => {
      if (!(await flush())) return
      const result = await track(publishDoc(type, id))
      if (result.ok) {
        setStatus('published')
        setNotice({ kind: 'ok', text: result.message ?? 'Published.' })
      } else {
        setNotice({ kind: 'error', text: result.error, problems: result.problems })
      }
    })
  }, [flush, type, id, track])

  const discard = useCallback(async () => {
    const ok = await confirm({
      title: 'Discard unpublished changes?',
      message: 'Everything you changed since the last publish will be lost, and this page goes back to the published version.',
      confirmLabel: 'Discard changes',
      danger: true,
    })
    if (!ok) return
    startBusy(async () => {
      clearTimeout(timer.current)
      dirty.current = false
      const result = await track(discardDraft(type, id))
      if (result.ok) window.location.reload()
      else setNotice({ kind: 'error', text: result.error })
    })
  }, [type, id, confirm, track])

  // Warn before leaving with changes that haven't reached Sanity yet.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty.current || saveState === 'saving') e.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [saveState])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { values, set, status, setStatus, saveState, notice, setNotice, busy, publish, discard, flush }
}

export const newKey = () => Math.random().toString(36).slice(2, 14)
