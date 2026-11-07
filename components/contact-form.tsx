'use client'

import { useActionState, useState } from 'react'
import { sendEnquiry, type EnquiryField, type EnquiryState } from '@/app/(site)/contact/actions'

const initial: EnquiryState = { status: 'idle' }

const FIELDS: { name: EnquiryField; label: string; type: string; placeholder: string; autoComplete?: string }[] = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Your full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
  { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Portrait session, wedding, campaign…' },
]

export function ContactForm({ replyTime = 'within two working days' }: { replyTime?: string }) {
  const [state, action, pending] = useActionState(sendEnquiry, initial)
  // The result the visitor has moved on from ("Send another message").
  const [dismissed, setDismissed] = useState<EnquiryState | null>(null)
  const current = state === dismissed ? initial : state

  if (current.status === 'success') {
    return (
      <div className="rule-t in-1" role="status" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 32 }}>
        <p className="label">Message sent</p>
        <p className="d t-2">
          Thank you. <i>I&apos;ll reply {replyTime}.</i>
        </p>
        <button className="arrow" type="button" onClick={() => setDismissed(state)} style={{ alignSelf: 'flex-start' }}>
          <span>Send another message</span>
        </button>
      </div>
    )
  }

  const err = (f: EnquiryField) => current.errors?.[f]
  const val = (f: EnquiryField) => current.values?.[f]

  return (
    <form
      key={dismissed ? 'again' : 'first'}
      action={action}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
      aria-label="Enquiry form"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px 32px' }}>
        {FIELDS.slice(0, 2).map((f) => (
          <Field key={f.name} {...f} error={err(f.name)} defaultValue={val(f.name)} />
        ))}
      </div>
      <Field {...FIELDS[2]} error={err('subject')} defaultValue={val('subject')} />
      <div className="field">
        <label className="label" htmlFor="c-message">
          Message
        </label>
        <textarea
          className="input"
          id="c-message"
          name="message"
          rows={5}
          placeholder="Dates, location and what the photographs are for"
          defaultValue={val('message')}
          required
          aria-invalid={err('message') ? true : undefined}
          aria-describedby={err('message') ? 'c-message-error' : undefined}
        />
        {err('message') && (
          <span className="field-error" id="c-message-error">
            {err('message')}
          </span>
        )}
      </div>

      {/* Honeypot for bots */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="c-company">Company</label>
        <input id="c-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="caption" aria-live="polite">
          {current.status === 'error' ? current.message : 'All fields are required.'}
        </span>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  type,
  placeholder,
  autoComplete,
  error,
  defaultValue,
}: {
  name: EnquiryField
  label: string
  type: string
  placeholder: string
  autoComplete?: string
  error?: string
  defaultValue?: string
}) {
  const id = `c-${name}`
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        className="input"
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}
