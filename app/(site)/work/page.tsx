import type { Metadata } from 'next'
import { WorkGallery } from '@/components/work-gallery'
import { getCategories, getProjects } from '@/sanity/fetch'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Selected portrait, fashion, wedding, event, product, architecture, lifestyle and travel photography.',
  alternates: { canonical: '/work' },
}

export default async function WorkPage() {
  const [projects, categories] = await Promise.all([getProjects(), getCategories()])

  return (
    <>
      <section className="wrap" style={{ paddingTop: 'clamp(32px, 4vw, 64px)', paddingBottom: 48 }}>
        <div className="grid" style={{ alignItems: 'end' }}>
          <div className="in-1" style={{ gridColumn: '1 / span 7', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p className="label">Work</p>
            <h1 className="d t-1">
              Selected <i>work</i>
            </h1>
          </div>
          <p className="body tab-full in-2" style={{ gridColumn: '9 / span 4', marginTop: 32 }}>
            Commissions and personal pictures. Choose a category, or open any project to see the full story.
          </p>
        </div>
      </section>
      <WorkGallery projects={projects} categories={categories} />
    </>
  )
}
