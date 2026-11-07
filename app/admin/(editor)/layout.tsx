import { Suspense } from 'react'
import { ActivityProvider } from '@/components/admin/activity'
import { ConfirmProvider } from '@/components/admin/confirm'
import { Sidebar } from '@/components/admin/sidebar'
import { requireEditor } from '@/lib/auth/dal'
import { FALLBACK_NAME } from '@/lib/site'
import { getSettings } from '@/sanity/fetch'

function Loading() {
  return (
    <div className="ad">
      <aside className="side" />
      <div className="main">
        <div className="content">
          <p className="saving" aria-busy="true">
            Loading…
          </p>
        </div>
      </div>
    </div>
  )
}

/** Checks the editor session on every request; anyone else sees the 404 page. */
async function Shell({ children }: { children: React.ReactNode }) {
  const [editor, settings] = await Promise.all([requireEditor(), getSettings()])
  return (
    <div className="ad">
      <Sidebar siteName={settings?.photographerName ?? FALLBACK_NAME} editorName={editor.name} />
      <div className="main">
        <ActivityProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ActivityProvider>
      </div>
    </div>
  )
}

export default function EditorLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<Loading />}>
      <Shell>{children}</Shell>
    </Suspense>
  )
}
