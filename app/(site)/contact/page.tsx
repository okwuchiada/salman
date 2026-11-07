import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact-form'
import { getSettings } from '@/sanity/fetch'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Enquiries for portrait, fashion, wedding, event, product, architecture and travel photography.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const settings = await getSettings()

  return (
    <section className="wrap" style={{ paddingTop: 'clamp(32px, 4vw, 56px)', paddingBottom: 'clamp(64px, 8vw, 128px)' }}>
      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="tab-full in-1" style={{ gridColumn: '1 / span 5', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <p className="label">Contact</p>
          <h1 className="d t-1">
            Tell me about the picture <i>you have in mind.</i>
          </h1>
          {settings?.contactIntro && <p className="body-l">{settings.contactIntro}</p>}
          <dl className="rule-t" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24, paddingTop: 32, margin: 0 }}>
            {settings?.email && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <dt className="label">Email</dt>
                <dd style={{ margin: 0 }}>
                  <a className="link" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </dd>
              </div>
            )}
            {settings?.instagramUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <dt className="label">Instagram</dt>
                <dd style={{ margin: 0 }}>
                  <a className="link" href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
                    {settings.instagramHandle ?? 'Instagram'}
                  </a>
                </dd>
              </div>
            )}
            {settings?.location && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <dt className="label">Studio</dt>
                <dd className="body" style={{ margin: 0 }}>
                  {settings.location}
                </dd>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <dt className="label">Reply</dt>
              <dd className="body" style={{ margin: 0 }}>
                Within two working days
              </dd>
            </div>
          </dl>
        </div>

        <div className="tab-full in-2" style={{ gridColumn: '7 / span 6', marginTop: 8 }}>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
