'use client'

import { urlFor } from '@/sanity/image'

export type Uploaded = { assetId: string; width: number | null; height: number | null }

/** Sends one file to /api/admin/upload. Throws with a readable message on failure. */
export async function uploadPhoto(file: File): Promise<Uploaded> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body })
  const data = (await res.json().catch(() => ({}))) as Partial<Uploaded> & { error?: string }
  if (!res.ok || !data.assetId) throw new Error(data.error ?? `Could not upload ${file.name}.`)
  return { assetId: data.assetId, width: data.width ?? null, height: data.height ?? null }
}

/** A small square preview of a Sanity image asset. */
export function thumb(assetRef: string | undefined, size = 320) {
  if (!assetRef) return ''
  return urlFor({ asset: { _ref: assetRef } }).width(size).height(size).fit('crop').url()
}

/** A preview at the photo's own proportions. */
export function preview(assetRef: string | undefined, width = 480) {
  if (!assetRef) return ''
  return urlFor({ asset: { _ref: assetRef } }).width(width).url()
}

/** Width × height, read from a Sanity image asset id (image-<hash>-<w>x<h>-<ext>). */
export function dimensionsOf(assetRef: string | undefined) {
  const m = assetRef?.match(/-(\d+)x(\d+)-/)
  return m ? `${m[1]} × ${m[2]}` : ''
}
