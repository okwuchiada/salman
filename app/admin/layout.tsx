import type { Metadata } from 'next'
import { AdminThemeScript } from '@/components/admin/admin-theme'
import './admin.css'

export const metadata: Metadata = {
  title: { default: 'Editor', template: '%s · Editor' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <AdminThemeScript />
      {children}
    </>
  )
}
