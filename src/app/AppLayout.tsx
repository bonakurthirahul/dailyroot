import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { SupabaseNotice } from '../components/feedback/SupabaseNotice'
import { Toaster } from '../components/feedback/Toaster'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <SupabaseNotice />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  )
}
