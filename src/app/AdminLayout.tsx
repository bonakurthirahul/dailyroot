import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { Toaster } from '../components/feedback/Toaster'
import { SupabaseNotice } from '../components/feedback/SupabaseNotice'
import { ROLE_LABELS } from '../types/db'
import type { Capability } from '../lib/permissions'
import { cn } from '../lib/cn'

interface NavItem {
  to: string
  label: string
  capability: Capability
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', capability: 'view_orders', end: true },
  { to: '/admin/orders', label: 'Orders', capability: 'view_orders' },
  { to: '/admin/menu', label: 'Menu', capability: 'manage_menu' },
  { to: '/admin/categories', label: 'Categories', capability: 'manage_menu' },
  { to: '/admin/modifiers', label: 'Modifiers', capability: 'manage_menu' },
  { to: '/admin/tables', label: 'Tables & QR', capability: 'manage_tables' },
  { to: '/admin/reports', label: 'Reports', capability: 'view_reports' },
  { to: '/admin/staff', label: 'Staff', capability: 'manage_staff' },
  { to: '/admin/settings', label: 'Settings', capability: 'manage_settings' },
]

export function AdminLayout() {
  const { user, can, signOut } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) => can(item.capability))

  async function handleSignOut() {
    await signOut()
    navigate('/staff/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-cream-100">
      <SupabaseNotice />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="border-b border-coffee-600/10 bg-espresso-950 text-cream-200 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center gap-3 px-5">
            <span className="flex size-9 items-center justify-center rounded-full bg-cream-100 font-display text-lg text-espresso-900">
              B
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg text-cream-50">
                Brew &amp; Bean
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-cream-300/60">
                Admin
              </span>
            </div>
          </div>
          <nav
            aria-label="Admin"
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible"
          >
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cream-100 text-espresso-900'
                      : 'text-cream-200/80 hover:bg-espresso-800 hover:text-cream-50',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-coffee-600/10 bg-cream-50/80 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-coffee-700">
              <span className="font-semibold text-espresso-900">
                {user?.full_name}
              </span>
              {user ? (
                <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-medium text-espresso-800">
                  {ROLE_LABELS[user.role]}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-coffee-700 hover:bg-cream-200 sm:inline-flex"
              >
                View site
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-coffee-600/25 px-3 py-1.5 text-sm font-medium text-espresso-900 hover:bg-cream-200"
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-5 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
