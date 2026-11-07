import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProjectSequence } from '@/components/project-sequence'
import { urlFor } from '@/sanity/image'
import { getProject, getProjects, getProjectSlugs } from '@/sanity/fetch'

export async function generateStaticParams() {
  const slugs = await getProjectSlugs()
  return slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Project not found' }
  const description = project.seoDescription ?? project.summary ?? undefined
  const image = project.coverImage?.asset ? urlFor(project.coverImage).width(1200).height(630).fit('crop').url() : undefined
  return {
    title: project.title ?? 'Project',
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { title: project.title ?? undefined, description, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined },
  }
}

async function ProjectContent({ params }: Pick<PageProps<'/work/[slug]'>, 'params'>) {
  const { slug } = await params
  const [project, all] = await Promise.all([getProject(slug), getProjects()])
  if (!project?.slug) notFound()

  const index = all.findIndex((p) => p.slug === project.slug)
  const prev = all.length > 1 ? all[(index - 1 + all.length) % all.length] : null
  const next = all.length > 1 ? all[(index + 1) % all.length] : null
  const gallery = project.gallery ?? []
  const count = gallery.length + (project.coverImage?.asset ? 1 : 0)
  const details = [
    project.category?.title && ['Category', project.category.title],
    project.client && ['Client', project.client],
    project.location && ['Location', project.location],
    project.year && ['Year', String(project.year)],
    ['Images', String(count)],
  ].filter(Boolean) as [string, string][]

  return (
    <>
      {/* Title */}
      <section className="wrap" style={{ paddingTop: 'clamp(24px, 3vw, 48px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}>
        <Link className="arrow back" href="/work">
          <b aria-hidden="true">←</b>
          <span>All work</span>
        </Link>
        <div className="grid" style={{ alignItems: 'end', marginTop: 32 }}>
          <div className="in-1" style={{ gridColumn: '1 / span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p className="label num">
              {[project.category?.title, project.year].filter(Boolean).join(' · ')}
            </p>
            <h1 className="d t-hero">{project.title}</h1>
          </div>
          <div className="tab-full in-2" style={{ gridColumn: '9 / span 4', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {project.summary && <p className="lede">{project.summary}</p>}
            <dl className="meta-list rule-t">
              {details.map(([term, value]) => (
                <div key={term} style={{ display: 'contents' }}>
                  <dt className="label">{term}</dt>
                  <dd className="caption fg num">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <ProjectSequence
        title={project.title ?? 'Project'}
        slug={project.slug}
        cover={project.coverImage}
        gallery={gallery}
        statement={project.statement}
      />

      {/* Credits */}
      {project.credits && project.credits.length > 0 && (
        <section className="wrap" style={{ paddingTop: 'clamp(64px, 7vw, 112px)' }}>
          <div className="grid" data-reveal="text">
            <p className="label" style={{ gridColumn: '1 / span 3' }}>
              Credits
            </p>
            <dl
              className="tab-full"
              style={{ gridColumn: '5 / span 6', margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px 24px' }}
            >
              {project.credits.map((c) => (
                <div key={c._key}>
                  <dt className="label">{c.role}</dt>
                  <dd className="body" style={{ margin: 0 }}>
                    {c.name}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Previous / next */}
      <nav className="wrap" aria-label="More projects" style={{ paddingTop: 'clamp(64px, 8vw, 128px)' }}>
        {prev?.slug && next?.slug && (
          <div className="rule-t rule-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <Link className="pn prev" href={`/work/${prev.slug}`}>
              <span className="label">← Previous project</span>
              <span className="d t-2">{prev.title}</span>
              {prev.category?.title && <span className="label">{prev.category.title}</span>}
            </Link>
            <Link className="pn next" href={`/work/${next.slug}`}>
              <span className="label">Next project →</span>
              <span className="d t-2">{next.title}</span>
              {next.category?.title && <span className="label">{next.category.title}</span>}
            </Link>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: '40px 88px' }}>
          <Link className="arrow" href="/work">
            <span>Back to all work</span>
          </Link>
        </div>
      </nav>
    </>
  )
}

function ProjectFallback() {
  return (
    <section className="wrap" style={{ paddingBlock: 'clamp(64px, 8vw, 128px)' }} aria-busy="true">
      <p className="label">Loading project</p>
    </section>
  )
}

export default function ProjectPage(props: PageProps<'/work/[slug]'>) {
  return (
    <Suspense fallback={<ProjectFallback />}>
      <ProjectContent params={props.params} />
    </Suspense>
  )
}
