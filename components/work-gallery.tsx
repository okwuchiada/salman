'use client'

import { useState, useTransition } from 'react'
import { ProjectCard, type ProjectCardData } from './project-card'

type Category = { _id: string; title: string | null; slug: string | null }
type Project = ProjectCardData & { category: { title: string | null; slug: string | null } | null }

// Widths and alignment cycle through the two columns so no two rows look alike.
// One step smaller than full width so the gallery breathes without long empty runs.
const RHYTHM = [
  { width: '86%', alignSelf: 'flex-start' },
  { width: '74%', alignSelf: 'flex-end' },
  { width: '64%', alignSelf: 'flex-start' },
  { width: '88%', alignSelf: 'flex-end' },
  { width: '76%', alignSelf: 'flex-end' },
  { width: '62%', alignSelf: 'flex-start' },
] as const

const COL_SIZES = {
  left: '(max-width: 760px) 100vw, 44vw',
  right: '(max-width: 760px) 100vw, 32vw',
}

export function WorkGallery({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const [active, setActive] = useState('all')
  const [, startTransition] = useTransition()

  const filters = [
    { slug: 'all', title: 'All Work', count: projects.length },
    ...categories
      .map((c) => ({
        slug: c.slug ?? c._id,
        title: c.title ?? 'Untitled',
        count: projects.filter((p) => p.category?.slug === c.slug).length,
      }))
      // Only offer categories that have work in them
      .filter((c) => c.count > 0),
  ]
  const shown = active === 'all' ? projects : projects.filter((p) => p.category?.slug === active)
  const activeTitle = filters.find((f) => f.slug === active)?.title
  const left = shown.filter((_, i) => i % 2 === 0)
  const right = shown.filter((_, i) => i % 2 === 1)

  return (
    <>
      <div className="filter-bar">
        <div className="wrap">
          <div className="filter-bar-inner rule-t rule-b">
            <div className="filters" role="group" aria-label="Filter by category">
              {filters.map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  className="filter"
                  aria-pressed={active === f.slug}
                  onClick={() => startTransition(() => setActive(f.slug))}
                >
                  {f.title}
                  <span className="count num">{f.count}</span>
                </button>
              ))}
            </div>
            <span className="caption num hide-m" aria-live="polite">
              Showing {shown.length} of {projects.length}
            </span>
          </div>
        </div>
      </div>

      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 'clamp(72px, 8vw, 128px)' }} aria-label={activeTitle}>
        {shown.length === 0 ? (
          <div key={active} className="gallery-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBlock: 120, maxWidth: 520 }}>
            <p className="label">{activeTitle}</p>
            <p className="d t-2">
              New work is <i>on its way.</i>
            </p>
            <p className="body">Photographs for this category will appear here as soon as they are added.</p>
          </div>
        ) : (
          <div key={active} className="gallery-enter">
            <div className="gallery-cols">
              <div className="gallery-col">
                {left.map((p, i) => (
                  <ProjectCard key={p._id} project={p} sizes={COL_SIZES.left} style={RHYTHM[(i * 2) % RHYTHM.length]} />
                ))}
              </div>
              <div className="gallery-col offset">
                {right.map((p, i) => (
                  <ProjectCard key={p._id} project={p} sizes={COL_SIZES.right} style={RHYTHM[(i * 2 + 1) % RHYTHM.length]} />
                ))}
              </div>
            </div>
            <div className="gallery-single">
              {shown.map((p) => (
                <ProjectCard key={p._id} project={p} sizes="100vw" />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
