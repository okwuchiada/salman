'use server'

export type EnquiryField = 'name' | 'email' | 'subject' | 'message'

export type EnquiryState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<EnquiryField, string>>
  values?: Partial<Record<EnquiryField, string>>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates and receives an enquiry from the contact form.
 *
 * Delivery: until an email service is chosen, enquiries are written to the
 * server log. To send them by email, replace `deliver` with a call to your
 * provider (for example Resend), using a server-only API key.
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

async function deliver(enquiry: Record<EnquiryField, string>) {
  console.info('[enquiry]', JSON.stringify({ ...enquiry, receivedAt: new Date().toISOString() }))
}
