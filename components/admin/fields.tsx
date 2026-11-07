'use client'

import { useId } from 'react'
import { Dropdown, type DropdownOption } from './dropdown'
import { newKey } from './use-draft'

type Base = { label: string; hint?: string }

export function TextField({
  label,
  hint,
  value,
  onChange,
  big,
  type = 'text',
  placeholder,
  max,
}: Base & {
  value: string | undefined
  onChange: (v: string) => void
  big?: boolean
  type?: 'text' | 'email' | 'url'
  placeholder?: string
  max?: number
}) {
  const id = useId()
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`in${big ? ' big' : ''}`}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 3,
  max,
  placeholder,
}: Base & { value: string | undefined; onChange: (v: string) => void; rows?: number; max?: number; placeholder?: string }) {
  const id = useId()
  const length = (value ?? '').length
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="in" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        {hint ? <span className="hint">{hint}</span> : <span />}
        {max && (
          <span className={`count${length > max ? ' over' : ''}`}>
            {length} / {max}
          </span>
        )}
      </div>
    </div>
  )
}

export function NumberField({ label, hint, value, onChange }: Base & { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const id = useId()
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="in"
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/** A choice from a list, using the editor's custom dropdown. */
export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  clearLabel,
}: Base & {
  value: string | undefined
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
  clearLabel?: string
}) {
  return <Dropdown label={label} hint={hint} value={value} onChange={onChange} options={options} placeholder={placeholder} clearLabel={clearLabel} />
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export function SlugField({
  value,
  onChange,
  source,
  prefix,
}: {
  value: string | undefined
  onChange: (v: string) => void
  source: string | undefined
  prefix: string
}) {
  const id = useId()
  return (
    <div className="f">
      <label htmlFor={id}>Web address</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="slug" style={{ flex: 1 }}>
          <span>{prefix}</span>
          <input id={id} type="text" value={value ?? ''} onChange={(e) => onChange(slugify(e.target.value))} />
        </div>
        <button className="b" type="button" onClick={() => onChange(slugify(source ?? ''))} disabled={!source}>
          From title
        </button>
      </div>
      <span className="hint">Lowercase letters, numbers and hyphens. Changing it changes the page’s link.</span>
    </div>
  )
}

/** Moves an item in a list. */
export function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

type ObjItem = { _key: string; _type?: string } & Record<string, string | undefined>

/** A repeatable group of text fields (credits, approach steps, specialisations). */
export function ObjectList({
  label,
  hint,
  items,
  onChange,
  itemType,
  fields,
  addLabel,
  max,
}: Base & {
  items: ObjItem[] | undefined
  onChange: (items: ObjItem[]) => void
  itemType: string
  fields: { name: string; label: string; multiline?: boolean }[]
  addLabel: string
  max?: number
}) {
  const list = items ?? []
  const update = (i: number, name: string, v: string) => onChange(list.map((it, j) => (j === i ? { ...it, [name]: v } : it)))
  return (
    <div className="card">
      <div className="card-h">
        <h2>{label}</h2>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {list.length > 0 && (
        <div>
          {list.map((item, i) => (
            <div className="list-item" key={item._key}>
              <div className="list-fields">
                {fields.map((f) =>
                  f.multiline ? (
                    <textarea
                      key={f.name}
                      className="in"
                      rows={2}
                      aria-label={`${f.label} ${i + 1}`}
                      placeholder={f.label}
                      value={item[f.name] ?? ''}
                      onChange={(e) => update(i, f.name, e.target.value)}
                    />
                  ) : (
                    <input
                      key={f.name}
                      className="in"
                      aria-label={`${f.label} ${i + 1}`}
                      placeholder={f.label}
                      value={item[f.name] ?? ''}
                      onChange={(e) => update(i, f.name, e.target.value)}
                    />
                  ),
                )}
              </div>
              <div className="list-tools">
                <button className="icon-btn" type="button" aria-label="Move up" disabled={i === 0} onClick={() => onChange(move(list, i, i - 1))}>
                  ↑
                </button>
                <button className="icon-btn" type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => onChange(move(list, i, i + 1))}>
                  ↓
                </button>
                <button className="icon-btn" type="button" aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        className="b"
        type="button"
        style={{ alignSelf: 'flex-start' }}
        disabled={max !== undefined && list.length >= max}
        onClick={() => onChange([...list, { _key: newKey(), _type: itemType }])}
      >
        + {addLabel}
      </button>
    </div>
  )
}
