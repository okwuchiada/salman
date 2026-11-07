import Link from 'next/link'
import { ItalicTail } from '@/components/italic-tail'
import { ProjectCard } from '@/components/project-card'
import { SanityImage, photoSize, type Photo } from '@/components/sanity-image'
import { FALLBACK_NAME } from '@/lib/site'
import { getAbout, getSettings } from '@/sanity/fetch'

// Positions for Selected work: off-centre, staggered, then one wide moment.
const SLOTS = [
  { gridColumn: '1 / span 4', sizes: '(max-width: 760px) 100vw, 32vw' },
  { gridColumn: '7 / span 5', marginTop: 140, sizes: '(max-width: 760px) 100vw, 40vw' },
  { gridColumn: '2 / span 3', marginTop: 100, sizes: '(max-width: 760px) 100vw, 24vw' },
  { gridColumn: '8 / span 4', marginTop: 48, sizes: '(max-width: 760px) 100vw, 32vw' },
  { gridColumn: '2 / span 10', marginTop: 120, sizes: '(max-width: 760px) 100vw, 80vw', feature: true },
] as const

const isWide = (p: Photo) => {
  const { width, height } = photoSize(p)
  return width / height > 1.15
}

export default async function Home() {
  const [settings, about] = await Promise.all([getSettings(), getAbout()])
  const name = settings?.photographerName ?? FALLBACK_NAME
  const hero = settings?.heroProject
  const selected = (settings?.selectedWork ?? []).filter((p): p is NonNullable<typeof p> => Boolean(p?.slug))

  return (
    <>
      {/* Hero */}
      <section className="wrap" style={{ paddingTop: 'clamp(32px, 4vw, 56px)', paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
        <div className="grid" style={{ alignItems: 'end' }}>
          <h1 className="d t-hero in-1" style={{ gridColumn: '1 / span 10' }}>
            <ItalicTail text={settings?.heroHeadline ?? 'Photography that feels like something.'} />
          </h1>
          <div className="tab-full in-2" style={{ gridColumn: '1 / span 5', marginTop: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p className="label">
              {name}
              {settings?.role ? ` · ${settings.role}` : ''}
            </p>
            {settings?.heroStatement && <p className="body-l">{settings.heroStatement}</p>}
            <a className="cue label hide-m" href="#selected">
              <i />
              Scroll to the work
            </a>
          </div>
          {hero?.slug && (
            <figure className="tab-full" style={{ gridColumn: '8 / span 5', marginTop: 48 }}>
              <Link href={`/work/${hero.slug}`} className="work">
                <div className="ph bleed-m in-img">
                  <SanityImage value={hero.coverImage} sizes="(max-width: 1100px) 100vw, 38vw" priority />
                </div>
                <figcaption className="work-meta">
                  <span className="caption fg">
                    <span className="work-title">{hero.title}</span>
                  </span>
                  {hero.category?.title && <span className="label">{hero.category.title}</span>}
                </figcaption>
              </Link>
            </figure>
          )}
        </div>
      </section>

      {/* Selected work */}
      {selected.length > 0 && (
        <section id="selected" className="wrap rule-t" style={{ paddingTop: 'clamp(56px, 6vw, 88px)', paddingBottom: 'clamp(72px, 8vw, 128px)' }}>
          <div className="grid" style={{ alignItems: 'end' }} data-reveal="text">
            <div style={{ gridColumn: '1 / span 6', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p className="label">Selected work</p>
              <h2 className="d t-1">
                Recent <i>pictures</i>
              </h2>
            </div>
            <div className="hide-m" style={{ gridColumn: '10 / span 3', justifySelf: 'end' }}>
              <Link className="arrow" href="/work">
                <span>View all work</span>
                <b aria-hidden="true">→</b>
              </Link>
            </div>
          </div>

          <div className="grid" style={{ alignItems: 'start', marginTop: 64 }}>
            {selected.map((project, i) => {
              const slot = SLOTS[i % SLOTS.length]
              const feature = 'feature' in slot && slot.feature
              const wide = isWide(project.coverImage)
              return (
                <ProjectCard
                  key={project._id}
                  project={project}
                  sizes={feature && !wide ? '(max-width: 760px) 100vw, 40vw' : slot.sizes}
                  drift={feature && wide}
                  style={{
                    gridColumn: feature && !wide ? '4 / span 5' : slot.gridColumn,
                    marginTop: 'marginTop' in slot ? slot.marginTop : undefined,
                  }}
                />
              )
            })}
          </div>

          <div className="show-m" style={{ marginTop: 48 }}>
            <Link className="arrow" href="/work">
              <span>View all work</span>
              <b aria-hidden="true">→</b>
            </Link>
          </div>
        </section>
      )}

      {/* About introduction */}
      <section className="wrap" style={{ paddingBottom: 'clamp(72px, 8vw, 128px)' }}>
        <div className="grid" style={{ alignItems: 'end' }}>
          <figure className="tab-wide" style={{ gridColumn: '1 / span 3' }} data-reveal="image">
            {about?.portrait?.asset ? (
              <div className="ph">
                <SanityImage value={about.portrait} sizes="(max-width: 760px) 100vw, 24vw" />
              </div>
            ) : (
              <div className="ph ph-empty" role="img" aria-label="Portrait of the photographer, to be added">
                <span className="caption">Portrait of the photographer · add it in Sanity under About Page</span>
              </div>
            )}
          </figure>
          <div className="tab-full" style={{ gridColumn: '5 / span 7', display: 'flex', flexDirection: 'column', gap: 24 }} data-reveal="text">
            <p className="label">About</p>
            {about?.introduction && (
              <h2 className="d t-2">
                <ItalicTail text={about.introduction} words={3} />
              </h2>
            )}
            {about?.philosophy && (
              <div className="rule-t" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 24 }}>
                <p className="label">Approach</p>
                <p className="body">{about.philosophy}</p>
              </div>
            )}
            <Link className="arrow" href="/about" style={{ alignSelf: 'flex-start' }}>
              <span>More about {name.split(' ')[0]}</span>
              <b aria-hidden="true">→</b>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="band">
        <div className="wrap" style={{ paddingBlock: 'clamp(64px, 8vw, 120px)' }}>
          <div className="grid" style={{ alignItems: 'end' }} data-reveal="text">
            <div style={{ gridColumn: '1 / span 9', display: 'flex', flexDirection: 'column', gap: 28 }}>
              <p className="label">Commissions and collaborations</p>
              <h2 className="d t-1">
                <ItalicTail text={settings?.contactHeadline ?? "Let's create something meaningful."} />
              </h2>
            </div>
            <div className="tab-full" style={{ gridColumn: '1 / span 5', marginTop: 40 }}>
              <Link className="btn" href="/contact">
                Start an enquiry <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div
              className="tab-full"
              style={{ gridColumn: '7 / span 6', marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}
            >
              {settings?.email && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="label">Email</span>
                  <a className="link" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </div>
              )}
              {settings?.instagramUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="label">Instagram</span>
                  <a className="link" href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
                    {settings.instagramHandle ?? 'Instagram'}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
