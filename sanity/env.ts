function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}. Add it to .env.local.`)
  return value
}

export const projectId = required(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
)
export const dataset = required(process.env.NEXT_PUBLIC_SANITY_DATASET, 'NEXT_PUBLIC_SANITY_DATASET')

// Fixed date: bump deliberately when adopting newer API behaviour.
export const apiVersion = '2026-11-07'
