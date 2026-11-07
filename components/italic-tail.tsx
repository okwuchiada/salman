/**
 * Sets the last few words of a headline in italic: the editorial accent used
 * on every large serif title ("Photography that feels like *something.*").
 */
export function ItalicTail({ text, words = 1 }: { text: string; words?: number }) {
  const parts = text.trim().split(/\s+/)
  if (parts.length <= words) return <i>{text}</i>
  const head = parts.slice(0, -words).join(' ')
  const tail = parts.slice(-words).join(' ')
  return (
    <>
      {head} <i>{tail}</i>
    </>
  )
}
