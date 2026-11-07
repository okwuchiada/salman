/**
 * The email sent to the photographer for each contact-form enquiry.
 * Design: Option A "Wall label" (see the design canvas).
 *
 * Built for mail clients: table layout, inline styles, web-safe fonts
 * (Georgia for the headline, Arial for text), and a plain-text version.
 */

export type Enquiry = { name: string; email: string; subject: string; message: string }

const C = { ink: '#1A2230', muted: '#5A6170', rule: '#E3E5E9', accent: '#2E4A78', white: '#FFFFFF' }

/** Removes line breaks so nothing typed in a field can add email headers. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function firstName(name: string) {
  return name.split(/\s+/)[0] || name
}

function formatReceived(date: Date) {
  const timeZone = process.env.CONTACT_TIMEZONE || 'UTC'
  try {
    const text = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(date)
    return timeZone === 'UTC' ? `${text} UTC` : text
  } catch {
    return date.toUTCString()
  }
}

export function buildEnquiryEmail(enquiry: Enquiry, opts: { siteName: string; siteHost: string; receivedAt: Date }) {
  const name = oneLine(enquiry.name)
  const subject = oneLine(enquiry.subject)
  const email = oneLine(enquiry.email)
  const first = firstName(name)
  const received = formatReceived(opts.receivedAt)
  const paragraphs = enquiry.message
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  // Shown as the preview line in the inbox list.
  const preheader = `${name} · ${enquiry.message.replace(/\s+/g, ' ').trim()}`.slice(0, 140)
  const replyHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`

  const label = (text: string, last = false) =>
    `<td style="padding:9px 16px 9px 0;border-top:1px solid ${C.rule};${last ? `border-bottom:1px solid ${C.rule};` : ''}width:110px;color:${C.muted};font-size:11px;letter-spacing:2px;text-transform:uppercase;vertical-align:top;">${text}</td>`
  const value = (html: string, last = false) =>
    `<td style="padding:9px 0;border-top:1px solid ${C.rule};${last ? `border-bottom:1px solid ${C.rule};` : ''}font-size:14px;color:${C.ink};">${html}</td>`

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(`New enquiry: ${subject}`)}</title>
</head>
<body style="margin:0;padding:0;background:${C.white};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.white};">
<tr><td style="padding:32px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:Arial,Helvetica,sans-serif;color:${C.ink};font-size:15px;line-height:1.6;">
  <tr><td style="padding:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-weight:bold;">New enquiry</td></tr>
  <tr><td style="padding:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:${C.ink};">${escapeHtml(subject)}</td></tr>
  <tr><td style="padding:0 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>${label('Name')}${value(escapeHtml(name))}</tr>
      <tr>${label('Email')}${value(`<a href="${replyHref}" style="color:${C.accent};">${escapeHtml(email)}</a>`)}</tr>
      <tr>${label('Received', true)}${value(escapeHtml(received), true)}</tr>
    </table>
  </td></tr>
  ${paragraphs.map((p) => `<tr><td style="padding:0 0 14px;white-space:pre-wrap;">${escapeHtml(p)}</td></tr>`).join('\n  ')}
  <tr><td style="padding:14px 0 0;">
    <a href="${replyHref}" style="display:inline-block;background:${C.ink};color:${C.white};text-decoration:none;padding:13px 22px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Reply to ${escapeHtml(first)}</a>
  </td></tr>
  <tr><td style="padding:32px 0 0;">
    <p style="margin:0;padding-top:14px;border-top:1px solid ${C.rule};font-size:12px;color:${C.muted};">Sent from the contact form on ${escapeHtml(opts.siteHost)}. Replying to this email answers ${escapeHtml(first)} directly.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    'NEW ENQUIRY',
    subject,
    '',
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Received: ${received}`,
    '',
    enquiry.message.trim(),
    '',
    '—',
    `Sent from the contact form on ${opts.siteHost}. Replying to this email answers ${first} directly.`,
  ].join('\n')

  return {
    subject: `New enquiry: ${subject}`,
    fromName: `${oneLine(opts.siteName)} · Website`,
    html,
    text,
  }
}
