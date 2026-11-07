import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

/**
 * Called by a Sanity webhook when content is published, unpublished or deleted.
 * Clears the cached data for that document type (and the single project page),
 * so the change appears on the next page load instead of after the hourly refresh.
 *
 * Sanity webhook settings (sanity.io/manage → API → Webhooks):
 *   URL:        https://<your-domain>/api/revalidate
 *   Dataset:    production
 *   Trigger on: Create, Update, Delete
 *   Filter:     _type in ["project", "category", "siteSettings", "aboutPage"]
 *   Projection: { _type, "slug": slug.current }
 *   HTTP method: POST
 *   Secret:     the same value as SANITY_REVALIDATE_SECRET
 */

type WebhookPayload = { _type?: string; slug?: string | null }

// Tags used by the cached functions in sanity/fetch.ts
const TYPES = new Set(['project', 'category', 'siteSettings', 'aboutPage'])

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return Response.json({ message: 'SANITY_REVALIDATE_SECRET is not set' }, { status: 500 })
  }

  try {
    // `true` waits briefly so Sanity's CDN has the new content before pages refetch.
    const { isValidSignature, body } = await parseBody<WebhookPayload>(req, secret, true)

    if (!isValidSignature) {
      return Response.json({ message: 'Invalid signature' }, { status: 401 })
    }
    if (!body?._type || !TYPES.has(body._type)) {
      return Response.json({ message: 'Unknown or missing document type' }, { status: 400 })
    }

    const tags = [body._type]
    if (body._type === 'project' && body.slug) tags.push(`project:${body.slug}`)

    // `expire: 0`: the next visitor gets fresh content rather than one more stale view.
    for (const tag of tags) revalidateTag(tag, { expire: 0 })

    return Response.json({ revalidated: tags })
  } catch (err) {
    console.error('[revalidate]', err)
    return Response.json({ message: 'Could not revalidate' }, { status: 500 })
  }
}
