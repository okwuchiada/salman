import { defineQuery } from 'next-sanity'

const PHOTO_PROJECTION = /* groq */ `
  alt,
  caption,
  hotspot,
  crop,
  asset->{
    _id,
    metadata { lqip, dimensions { width, height, aspectRatio } }
  }
`

const PROJECT_CARD_PROJECTION = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  year,
  "category": category->{ title, "slug": slug.current },
  coverImage { ${PHOTO_PROJECTION} }
`

export const SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0] {
    photographerName,
    role,
    heroHeadline,
    heroStatement,
    "heroProject": heroProject->{ ${PROJECT_CARD_PROJECTION} },
    "selectedWork": selectedWork[]->{ ${PROJECT_CARD_PROJECTION} },
    contactHeadline,
    contactIntro,
    email,
    instagramUrl,
    instagramHandle,
    location,
    seoDescription
  }
`)

export const ABOUT_QUERY = defineQuery(`
  *[_id == "aboutPage"][0] {
    portrait { ${PHOTO_PROJECTION} },
    introduction,
    biography,
    philosophy,
    approach[]{ _key, title, description },
    specialisations[]{ _key, title, description },
    experience
  }
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)] | order(orderRank asc, title asc) {
    _id,
    title,
    "slug": slug.current
  }
`)

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)] | order(orderRank asc, _createdAt desc) {
    ${PROJECT_CARD_PROJECTION}
  }
`)

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    "category": category->{ title, "slug": slug.current },
    summary,
    statement,
    year,
    client,
    location,
    credits[]{ _key, role, name },
    seoDescription,
    coverImage { ${PHOTO_PROJECTION} },
    gallery[]{ _key, ${PHOTO_PROJECTION} }
  }
`)

export const PROJECT_SLUGS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)].slug.current
`)
