import Link from 'next/link'
import { ViewTransition } from 'react'
import { SanityImage, type Photo } from './sanity-image'

export type ProjectCardData = {
  _id: string
  title: string | null
  slug: string | null
  category: { title: string | null } | null
  coverImage: Photo
}

/**
 * A project's cover with its title and category. The cover shares a view
 * transition name with the project page's opening photograph, so it morphs
 * into place on navigation.
 */
export function ProjectCard({
  project,
  sizes,
  className,
  style,
  drift,
}: {
  project: ProjectCardData
  sizes: string
  className?: string
  style?: React.CSSProperties
  drift?: boolean
}) {
  if (!project.slug) return null
  return (
    <Link className={`work ${className ?? ''}`} href={`/work/${project.slug}`} style={style} data-reveal="image">
      <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
        <div className={`ph${drift ? ' drift' : ''}`}>
          <SanityImage value={project.coverImage} sizes={sizes} />
        </div>
      </ViewTransition>
      <div className="work-meta reveal-meta">
        <span className="d t-4">
          <span className="work-title">{project.title}</span>
        </span>
        {project.category?.title && <span className="label">{project.category.title}</span>}
      </div>
    </Link>
  )
}
