'use server'

import { headers } from 'next/headers'
import { Resend } from 'resend'
import { buildEnquiryEmail, oneLine } from '@/lib/email/enquiry-email'
import { FALLBACK_NAME, siteUrl } from '@/lib/site'
import { getSettings } from '@/sanity/fetch'

export type EnquiryField = 'name' | 'email' | 'subject' | 'message'

export type EnquiryState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<EnquiryField, string>>
  values?: Partial<Record<EnquiryField, string>>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates an enquiry from the contact form and emails it with Resend.
 *
 * Environment (server-only):
 *   RESEND_API_KEY      Resend API key
 *   CONTACT_TO_EMAIL    where enquiries go (comma-separated for several)
 *   CONTACT_FROM_EMAIL  sender address on a domain verified in Resend, e.g. hello@yourdomain.com.
 *                       Shown as "<photographer> · Website". Without it, Resend's test sender is
 *                       used, which only delivers to the address that owns the Resend account.
 *   CONTACT_TIMEZONE    optional, e.g. Europe/London, for the "Received" time (default UTC).
 * The email's design lives in lib/email/enquiry-email.ts.
 */
export async function sendEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const read = (key: string) => String(formData.get(key) ?? '').trim()

  // Honeypot: real visitors never see or fill this field.
  if (read('company')) return { status: 'success' }

  const values = {
    name: read('name').slice(0, 120),
    email: read('email').slice(0, 200),
    subject: read('subject').slice(0, 200),
    message: read('message').slice(0, 5000),
  }

  const errors: EnquiryState['errors'] = {}
  if (!values.name) errors.name = 'Add your name.'
  if (!EMAIL.test(values.email)) errors.email = 'Add a complete email address so I can reply.'
  if (!values.subject) errors.subject = 'Add a short subject, for example "Portrait session".'
  if (values.message.length < 10) errors.message = 'Tell me a little more: dates, location and what the photographs are for.'

  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors, values }
  }

  if (await tooManyRequests()) {
    return {
      status: 'error',
      message: 'Too many messages in a short time. Please wait a few minutes, or write to the email address on this page.',
      values,
    }
  }

  try {
    await deliver(values)
  } catch {
    return {
      status: 'error',
      message: 'Your message could not be sent. Please try again, or write to the email address on this page.',
      values,
    }
  }

  return { status: 'success' }
}

/* ---------- Delivery ---------- */

/** Builds the sender: a bare address gets the site's name, e.g. "Salman · Website <hello@site.com>". */
function sender(configured: string | undefined, fromName: string) {
  const value = configured?.trim()
  if (value && value.includes('<')) return value // already "Name <address>"
  const address = value || 'onboarding@resend.dev' // Resend's test sender
  return `${fromName.replace(/[<>"]/g, '')} <${address}>`
}

async function deliver(enquiry: Record<EnquiryField, string>) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL?.split(',').map((e) => e.trim()).filter(Boolean)

  if (!key || !to?.length) {
    // Never tell a visitor their message was sent when it wasn't.
    if (process.env.NODE_ENV === 'production') {
      console.error('[enquiry] Email is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL.')
      throw new Error('Email not configured')
    }
    console.info('[enquiry] Email not configured; logged instead:', JSON.stringify(enquiry))
    return
  }

  const settings = await getSettings()
  const email = buildEnquiryEmail(enquiry, {
    siteName: settings?.photographerName ?? FALLBACK_NAME,
    siteHost: siteUrl.replace(/^https?:\/\//, ''),
    receivedAt: new Date(),
  })

  const { error } = await new Resend(key).emails.send({
    from: sender(process.env.CONTACT_FROM_EMAIL, email.fromName),
    to,
    replyTo: oneLine(enquiry.email),
    subject: email.subject,
    text: email.text,
    html: email.html,
  })
  if (error) {
    console.error('[enquiry] Resend could not send:', error.name, error.message)
    throw new Error('Send failed')
  }
}

/* ---------- Basic flood protection ---------- */

const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 5
const recent = new Map<string, number[]>()

/**
 * At most 5 enquiries per 10 minutes from one address. Kept in memory, so it
 * resets on deploys and isn't shared between server instances; it stops casual
 * floods, not determined abuse.
 */
async function tooManyRequests() {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (times.length >= LIMIT) return true
  times.push(now)
  recent.set(ip, times)
  if (recent.size > 5000) recent.clear()
  return false
}
