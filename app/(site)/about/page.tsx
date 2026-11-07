import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { ItalicTail } from '@/components/italic-tail'
import { SanityImage } from '@/components/sanity-image'
import { FALLBACK_NAME } from '@/lib/site'
import { getAbout, getSettings } from '@/sanity/fetch'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, about] = await Promise.all([getSettings(), getAbout()])
  return {
    title: 'About',
    description: about?.introduction ?? `About ${settings?.photographerName ?? FALLBACK_NAME}.`,
    alternates: { canonical: '/about' },
  }
}

/** Sets everything after the first sentence in italic. */
function Statement({ text }: { text: string }) {
  const m = text.match(/^(.+?[.!?])\s+(.+)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]} <i>{m[2]}</i>
    </>
  )
}

const pad = (x: number) => String(x).padStart(2, '0')

export default async function AboutPage() {
  const [settings, about] = await Promise.all([getSettings(), getAbout()])
  const name = settings?.photographerName ?? FALLBACK_NAME

  return (
    <>
      {/* Opening */}
      <section className="wrap" style={{ paddingTop: 'clamp(24px, 3vw, 48px)', paddingBottom: 'clamp(64px, 8vw, 128px)' }}>
        <div className="grid" style={{ alignItems: 'end' }}>
          <figure className="tab-wide" style={{ gridColumn: '1 / span 5' }}>
            {about?.portrait?.asset ? (
              <div className="ph bleed-m in-img">
                <SanityImage value={about.portrait} sizes="(max-width: 1100px) 100vw, 42vw" priority />
              </div>
            ) : (
              <div className="ph ph-empty bleed-m" role="img" aria-label="Portrait of the photographer, to be added">
                <span className="caption">Large portrait of the photographer · add it in Sanity under About Page</span>
              </div>
            )}
          </figure>
          <div className="tab-full in-2" style={{ gridColumn: '7 / span 6', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p className="label">About</p>
            <h1 className="d t-1">
              <ItalicTail text={name} />
            </h1>
            {about?.introduction && <p className="lede">{about.introduction}</p>}
          </div>
        </div>
      </section>

      {/* Biography */}
      {about?.biography && about.biography.length > 0 && (
        <section className="wrap">
          <div className="grid">
            <p className="label" style={{ gridColumn: '1 / span 2' }}>
              Biography
            </p>
            <div className="tab-full body-l prose" style={{ gridColumn: '4 / span 6' }} data-reveal="text">
              <PortableText value={about.biography} />
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      {about?.philosophy && (
        <section className="wrap section">
          <div className="grid" style={{ alignItems: 'end' }}>
            <p className="label" style={{ gridColumn: '1 / span 2' }}>
              Philosophy
            </p>
            <p className="d t-1 tab-full" style={{ gridColumn: '3 / span 10' }} data-reveal="text">
              <Statement text={about.philosophy} />
            </p>
          </div>
        </section>
      )}

      {/* Approach */}
      {about?.approach && about.approach.length > 0 && (
        <section className="wrap rule-t" style={{ paddingTop: 56 }}>
          <div className="grid" style={{ alignItems: 'start' }}>
            <p className="label" style={{ gridColumn: '1 / span 2' }}>
              How I work
            </p>
            <ol
              className="tab-full"
              style={{ gridColumn: '4 / span 9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px 32px', margin: 0, padding: 0, listStyle: 'none' }}
              data-reveal="text"
            >
              {about.approach.map((step, i) => (
                <li key={step._key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span className="label num">{pad(i + 1)}</span>
                  <h3 className="d t-3">{step.title}</h3>
                  {step.description && <p className="body">{step.description}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Specialisations */}
      {about?.specialisations && about.specialisations.length > 0 && (
        <section className="wrap section">
          <div className="grid" style={{ alignItems: 'start' }}>
            <div className="tab-full" style={{ gridColumn: '1 / span 4', display: 'flex', flexDirection: 'column', gap: 20 }} data-reveal="text">
              <p className="label">Specialisations</p>
              <h2 className="d t-2">
                Many kinds of picture, <i>one way of seeing.</i>
              </h2>
            </div>
            <ul
              className="tab-full"
              style={{ gridColumn: '6 / span 7', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', columnGap: 32, margin: 0, padding: 0, listStyle: 'none' }}
              data-reveal="text"
            >
              {about.specialisations.map((s) => (
                <li key={s._key} className="rule-t" style={{ paddingBlock: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="d t-4">{s.title}</span>
                  {s.description && <span className="caption">{s.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Experience */}
      {about?.experience && (
        <section className="wrap" style={{ paddingBottom: 'clamp(64px, 8vw, 128px)' }}>
          <div className="grid" style={{ alignItems: 'start' }}>
            <p className="label" style={{ gridColumn: '1 / span 2' }}>
              Experience
            </p>
            <p className="body-l tab-full" style={{ gridColumn: '4 / span 6' }} data-reveal="text">
              {about.experience}
            </p>
          </div>
        </section>
      )}

      {/* Call to action */}
      <section className="band">
        <div className="wrap section">
          <div className="grid" style={{ alignItems: 'end' }} data-reveal="text">
            <h2 className="d t-1" style={{ gridColumn: '1 / span 8' }}>
              Have a project in mind? <i>Let&apos;s talk.</i>
            </h2>
            <div className="tab-full" style={{ gridColumn: '10 / span 3', justifySelf: 'end', marginTop: 40 }}>
              <Link className="btn" href="/contact">
                Get in touch <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
