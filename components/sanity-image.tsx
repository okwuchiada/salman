import Image from 'next/image'
import type { SanityImageSource } from '@sanity/image-url'
import { urlFor } from '@/sanity/image'

/** The photo shape returned by PHOTO_PROJECTION in sanity/queries.ts */
export type Photo = {
  alt: string | null
  caption?: string | null
  asset: {
    _id: string
    metadata: {
      lqip: string | null
      dimensions: { width: number | null; height: number | null } | null
    } | null
  } | null
} | null

export function photoSize(value: Photo) {
  return {
    width: value?.asset?.metadata?.dimensions?.width ?? 1600,
    height: value?.asset?.metadata?.dimensions?.height ?? 1067,
  }
}

/**
 * Renders a Sanity photo at its native aspect ratio with a blur placeholder.
 * `sizes` describes how wide the image is in the layout, so the browser
 * downloads the right size. Images below the fold load lazily by default.
 */
export function SanityImage({
  value,
  sizes,
  priority,
  fill,
  className,
}: {
  value: Photo
  sizes: string
  priority?: boolean
  fill?: boolean
  className?: string
}) {
  if (!value?.asset) return null
  const { width, height } = photoSize(value)
  const lqip = value.asset.metadata?.lqip ?? undefined
  const src = urlFor(value as SanityImageSource).width(Math.min(width, 2400)).url()

  if (fill) {
    return <Image src={src} alt={value.alt ?? ''} fill sizes={sizes} priority={priority} className={className} />
  }

  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={value.alt ?? ''}
      sizes={sizes}
      priority={priority}
      placeholder={lqip ? 'blur' : 'empty'}
      blurDataURL={lqip}
      className={className}
    />
  )
}
