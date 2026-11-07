/**
 * The private address of the editor sign-in page, from ADMIN_LOGIN_PATH.
 * Returns null when it isn't set, in which case sign-in is unavailable (fails closed).
 */
export function loginPath(): string | null {
  const raw = process.env.ADMIN_LOGIN_PATH?.trim().replace(/^\/+|\/+$/g, '')
  if (!raw || !/^[A-Za-z0-9_-]{8,64}$/.test(raw)) return null
  return `/${raw}`
}
