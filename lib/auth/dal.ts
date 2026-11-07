import 'server-only'
import { notFound } from 'next/navigation'
import { isAllowedEditor } from './editors'
import { getSession } from './session'

export type Editor = { email: string; name: string; picture?: string }

/**
 * The signed-in editor, re-checked against the allowlist on every call so that
 * removing someone from EDITOR_EMAILS takes effect immediately.
 */
export async function getEditor(): Promise<Editor | null> {
  const session = await getSession()
  if (!session.email || !isAllowedEditor(session.email)) return null
  return { email: session.email, name: session.name ?? session.email, picture: session.picture }
}

/**
 * For editor pages. Anyone who isn't a signed-in editor sees the normal 404 page,
 * so the editor's existence and its private sign-in address are never revealed.
 */
export async function requireEditor(): Promise<Editor> {
  const editor = await getEditor()
  if (!editor) notFound()
  return editor
}

/** For server actions and route handlers: fails loudly instead of redirecting. */
export async function assertEditor(): Promise<Editor> {
  const editor = await getEditor()
  if (!editor) throw new Error('Not signed in, or not allowed to edit.')
  return editor
}
