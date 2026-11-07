'use client'

/* eslint-disable @next/next/no-img-element -- option thumbnails come straight from Sanity's image CDN */

import { useEffect, useId, useRef, useState } from 'react'

export type DropdownOption = {
  value: string
  label: string
  /** Optional second line under the label. */
  description?: string
  /** Optional square thumbnail URL. */
  thumb?: string
}

/**
 * A custom select, styled to match the editor, following the WAI-ARIA
 * "select-only combobox" pattern:
 *  - Enter, Space, Alt+↓ or ↓ opens; ↑ ↓ Home End move; Enter or Tab chooses; Escape closes.
 *  - Typing a letter jumps to the next option starting with it.
 *  - Focus stays on the button; screen readers follow the highlighted option.
 */
export function Dropdown({
  label,
  hint,
  value,
  options,
  onChange,
  placeholder = 'Choose…',
  clearLabel,
  disabled,
  emptyText = 'Nothing to choose from yet.',
}: {
  label: string
  hint?: string
  value: string | undefined
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  /** When set, the list starts with this option, which clears the value. */
  clearLabel?: string
  disabled?: boolean
  emptyText?: string
}) {
  const id = useId()
  const labelId = `${id}-label`
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [up, setUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })

  const items: DropdownOption[] = clearLabel ? [{ value: '', label: clearLabel }, ...options] : options
  const selectedIndex = items.findIndex((o) => o.value === (value ?? ''))
  const selected = value ? options.find((o) => o.value === value) : undefined
  const optionId = (i: number) => `${id}-opt-${i}`

  function openList(at?: number) {
    if (disabled) return
    // Open upwards when there isn't room below.
    const rect = buttonRef.current?.getBoundingClientRect()
    setUp(rect ? window.innerHeight - rect.bottom < 300 && rect.top > window.innerHeight - rect.bottom : false)
    setActive(at ?? Math.max(0, selectedIndex))
    setOpen(true)
  }

  function choose(i: number) {
    const option = items[i]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId is derived from the stable id
  }, [open, active])

  function typeahead(key: string) {
    const now = Date.now()
    typed.current.text = now - typed.current.at > 600 ? key : typed.current.text + key
    typed.current.at = now
    const q = typed.current.text.toLowerCase()
    const start = open ? active + 1 : Math.max(0, selectedIndex) + 1
    const order = [...items.keys()].map((k) => (start + k) % items.length)
    const hit = order.find((i) => items[i].label.toLowerCase().startsWith(q))
    if (hit === undefined) return
    if (open) setActive(hit)
    else openList(hit)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const last = items.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList(e.key === 'ArrowUp' ? Math.max(0, selectedIndex - 1) : undefined)
      } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
        typeahead(e.key)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((a) => Math.min(last, a + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (e.altKey) choose(active)
        else setActive((a) => Math.max(0, a - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Tab':
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) typeahead(e.key)
    }
  }

  return (
    <div className="f">
      <span className="fl" id={labelId}>
        {label}
      </span>
      <div className="dd" ref={rootRef} data-open={open || undefined}>
        <button
          ref={buttonRef}
          type="button"
          className="dd-btn"
          role="combobox"
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && items.length ? optionId(active) : undefined}
          aria-disabled={disabled || undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
        >
          {selected?.thumb && <img className="dd-thumb" src={selected.thumb} alt="" />}
          <span className={`dd-value${selected ? '' : ' placeholder'}`}>{selected?.label ?? placeholder}</span>
          <svg className="dd-chev" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        {open && (
          <ul className={`dd-list${up ? ' up' : ''}`} id={listId} role="listbox" aria-labelledby={labelId} ref={listRef}>
            {items.length === 0 && <li className="dd-empty">{emptyText}</li>}
            {items.map((o, i) => (
              <li
                key={o.value || '__clear'}
                id={optionId(i)}
                role="option"
                aria-selected={i === selectedIndex}
                className={`dd-opt${o.value === '' ? ' clear' : ''}`}
                data-active={i === active || undefined}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => e.preventDefault()} // keep focus on the button
                onClick={() => choose(i)}
              >
                {o.thumb && <img className="dd-thumb" src={o.thumb} alt="" />}
                <span style={{ minWidth: 0 }}>
                  {o.label}
                  {o.description && <span className="desc">{o.description}</span>}
                </span>
                {i === selectedIndex && (
                  <svg className="check" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="m3 7.5 2.5 2.5L11 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}
