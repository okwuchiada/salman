import 'server-only'

/** Google addresses allowed to use the editor, from EDITOR_EMAILS (comma-separated). */
export function isAllowedEditor(email: string | undefined | null) {
  if (!email) return false
  const allowed = (process.env.EDITOR_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}
