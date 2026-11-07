'use client'

import { useCallback, useState, ViewTransition } from 'react'
import { Lightbox } from './lightbox'
import { SanityImage, photoSize, type Photo } from './sanity-image'

type Block =
  | { kind: 'single'; at: number; wide: boolean }
  | { kind: 'centre'; at: number; wide: boolean }
  | { kind: 'pair'; at: number }
  | { kind: 'trio'; at: number }
  | { kind: 'statement' }

const isWide = (p: Photo) => {
  const { width, height } = photoSize(p)
  return width / height > 1.15
}

/**
 * Lays out a project's photographs as a sequence: after the opening frame,
 * blocks cycle through single, unequal pair, centred and trio arrangements,
 * chosen by what is left and each photo's shape. Editors only order photos
 * in Sanity; the rhythm is decided here.
 */
function planSequence(gallery: Photo[], hasStatement: boolean): Block[] {
  const blocks: Block[] = []
  // Indexes into the full list where 0 is the cover, so gallery starts at 1.
  let i = 0
  let step = 0
  const left = () => gallery.length - i

  while (left() > 0) {
    const at = i + 1
    const shape = step % 4
    if (shape === 0) {
      blocks.push({ kind: 'single', at, wide: isWide(gallery[i]) })
      i += 1
      if (hasStatement && step === 0) blocks.push({ kind: 'statement' })
    } else if (shape === 1 && left() >= 2) {
      blocks.push({ kind: 'pair', at })
      i += 2
    } else if (shape === 3 && left() >= 3) {
      blocks.push({ kind: 'trio', at })
      i += 3
    } else {
      blocks.push({ kind: 'centre', at, wide: isWide(gallery[i]) })
      i += 1
    }
    step += 1
  }
  if (hasStatement && gallery.length === 0) blocks.push({ kind: 'statement' })
  return blocks
}

function Frame({
  photos,
  index,
  onOpen,
  sizes,
  className,
  style,
  caption,
}: {
  photos: Photo[]
  index: number
  onOpen: (index: number) => void
  sizes: string
  className?: string
  style?: React.CSSProperties
  caption?: boolean
}) {
  const photo = photos[index]
  return (
    <figure className={className} style={style} data-reveal="image">
      <button
        type="button"
        className="work zoom"
        onClick={() => onOpen(index)}
        aria-label={`View image ${index + 1} of ${photos.length} larger`}
      >
        <div className="ph">
          <SanityImage value={photo} sizes={sizes} />
        </div>
      </button>
      {caption && photo?.caption && (
        <figcaption className="caption reveal-meta" style={{ marginTop: 14 }}>
          {photo.caption}
        </figcaption>
      )}
    </figure>
  )
}

/** Sets everything after the first sentence in italic. */
function Statement({ text }: { text: string }) {
  const m = text.match(/^(.+?[.!?])\s+(.+)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]} <i>{m[2]}</i>
    </>
  )
}

const pad = (x: number) => String(x).padStart(2, '0')

export function ProjectSequence({
  title,
  slug,
  cover,
  gallery,
  statement,
}: {
  title: string
  slug: string
  cover: Photo
  gallery: Photo[]
  statement?: string | null
}) {
  const photos = [cover, ...gallery].filter((p) => p?.asset)
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const blocks = planSequence(gallery.filter((p) => p?.asset), Boolean(statement))

  return (
    <>
      {/* Opening photograph */}
      <section className="wrap">
        <div className="grid">
          <figure className="tab-full" style={{ gridColumn: isWide(cover) ? '2 / span 10' : '3 / span 7' }}>
            <button
              type="button"
              className="work zoom"
              onClick={() => setOpen(0)}
              aria-label={`View image 1 of ${photos.length} larger`}
            >
              <ViewTransition name={`cover-${slug}`} share="morph" default="none">
                <div className="ph bleed-m in-img">
                  <SanityImage value={cover} sizes="(max-width: 760px) 100vw, 58vw" priority />
                </div>
              </ViewTransition>
            </button>
          </figure>
        </div>
      </section>

      {blocks.map((block, n) => {
        const key = block.kind === 'statement' ? `statement-${n}` : `${block.kind}-${block.at}`
        switch (block.kind) {
          case 'statement':
            return (
              <section key={key} className="wrap section">
                <div className="grid">
                  <p className="d t-2 tab-full" data-reveal="text" style={{ gridColumn: '3 / span 8' }}>
                    <Statement text={statement ?? ''} />
                  </p>
                </div>
              </section>
            )
          case 'single':
            return (
              <section key={key} className="wrap" style={{ paddingTop: 'clamp(64px, 8vw, 128px)' }}>
                <div className="grid" style={{ alignItems: 'end' }}>
                  <Frame
                    photos={photos}
                    onOpen={setOpen}
                    index={block.at}
                    sizes="(max-width: 760px) 100vw, 40vw"
                    className="tab-wide"
                    style={{ gridColumn: block.wide ? '2 / span 6' : '3 / span 4' }}
                  />
                  <p className="tab-full reveal-meta" data-reveal="text" style={{ gridColumn: '9 / span 3', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="label num">{pad(block.at + 1)}</span>
                    {photos[block.at]?.caption && <span className="caption">{photos[block.at]?.caption}</span>}
                  </p>
                </div>
              </section>
            )
          case 'centre':
            return (
              <section key={key} className="wrap" style={{ paddingTop: 'clamp(64px, 8vw, 128px)' }}>
                <div className="grid">
                  <Frame
                    photos={photos}
                    onOpen={setOpen}
                    index={block.at}
                    sizes="(max-width: 760px) 100vw, 50vw"
                    caption
                    style={{ gridColumn: block.wide ? '3 / span 8' : '4 / span 5' }}
                  />
                </div>
              </section>
            )
          case 'pair':
            return (
              <section key={key} className="wrap" style={{ paddingTop: 'clamp(64px, 8vw, 128px)' }}>
                <div className="grid" style={{ alignItems: 'end' }}>
                  <Frame photos={photos} onOpen={setOpen} index={block.at} sizes="(max-width: 760px) 100vw, 48vw" caption style={{ gridColumn: '1 / span 6' }} />
                  <Frame photos={photos} onOpen={setOpen} index={block.at + 1} sizes="(max-width: 760px) 100vw, 24vw" caption style={{ gridColumn: '8 / span 3' }} />
                </div>
              </section>
            )
          case 'trio':
            return (
              <section key={key} className="wrap" style={{ paddingTop: 'clamp(64px, 8vw, 128px)' }}>
                <div className="grid" style={{ alignItems: 'start' }}>
                  <Frame photos={photos} onOpen={setOpen} index={block.at} sizes="(max-width: 760px) 100vw, 26vw" caption style={{ gridColumn: '2 / span 3' }} />
                  <Frame photos={photos} onOpen={setOpen} index={block.at + 1} sizes="(max-width: 760px) 100vw, 26vw" caption style={{ gridColumn: '6 / span 3', marginTop: 100 }} />
                  <Frame photos={photos} onOpen={setOpen} index={block.at + 2} sizes="(max-width: 760px) 100vw, 26vw" caption style={{ gridColumn: '10 / span 3', marginTop: 48 }} />
                </div>
              </section>
            )
        }
      })}

      {open !== null && <Lightbox photos={photos} index={open} title={title} onChange={setOpen} onClose={close} />}
    </>
  )
}
