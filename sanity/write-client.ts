import 'server-only'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

/**
 * Server-only client with write access, used by the /admin editor.
 * Reads the raw perspective so drafts and published documents are both visible.
 */
export function writeClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is not set, so the editor cannot save.')
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: 'raw' })
}
