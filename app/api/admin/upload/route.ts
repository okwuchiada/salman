import { getEditor } from '@/lib/auth/dal'
import { writeClient } from '@/sanity/write-client'

const MAX_BYTES = 40 * 1024 * 1024
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/tiff'])

/**
 * Uploads one photo to Sanity for the editor. A route handler rather than a server
 * action, because server actions are limited to 1MB and photos are larger.
 */
export async function POST(request: Request) {
  const editor = await getEditor()
  // Same answer as a route that doesn't exist, so the editor stays invisible.
  if (!editor) return new Response('Not Found', { status: 404 })

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return Response.json({ error: 'No file received.' }, { status: 400 })
  }
  if (!(file instanceof File)) return Response.json({ error: 'No file received.' }, { status: 400 })
  if (!TYPES.has(file.type)) return Response.json({ error: `${file.name} is not a supported image (JPEG, PNG, WebP, AVIF, HEIC or TIFF).` }, { status: 415 })
  if (file.size > MAX_BYTES) return Response.json({ error: `${file.name} is larger than 40MB.` }, { status: 413 })

  try {
    const asset = await writeClient().assets.upload('image', Buffer.from(await file.arrayBuffer()), {
      filename: file.name,
      contentType: file.type,
    })
    const dims = asset.metadata?.dimensions
    return Response.json({
      assetId: asset._id,
      url: asset.url,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    })
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: `Could not upload ${file.name}. Please try again.` }, { status: 502 })
  }
}
