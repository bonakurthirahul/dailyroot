import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AdminLayout } from './AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGate } from '../components/RoleGate'
import { LoadingState } from '../components/ui/LoadingState'
import { HomePage } from '../pages/HomePage'
import { MenuPage } from '../pages/MenuPage'
import { TableEntryPage } from '../pages/TableEntryPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { OrderTrackingPage } from '../pages/OrderTrackingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { LoginPage } from '../pages/staff/LoginPage'

const DashboardPage = lazy(() =>
  import('../pages/admin/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const OrdersPage = lazy(() =>
  import('../pages/admin/OrdersPage').then((module) => ({
    default: module.OrdersPage,
  })),
)
const OrderDetailPage = lazy(() =>
  import('../pages/admin/OrderDetailPage').then((module) => ({
    default: module.OrderDetailPage,
  })),
)
const MenuAdminPage = lazy(() =>
  import('../pages/admin/MenuAdminPage').then((module) => ({
    default: module.MenuAdminPage,
  })),
)
const CategoriesAdminPage = lazy(() =>
  import('../pages/admin/CategoriesAdminPage').then((module) => ({
    default: module.CategoriesAdminPage,
  })),
)
const ModifiersAdminPage = lazy(() =>
  import('../pages/admin/ModifiersAdminPage').then((module) => ({
    default: module.ModifiersAdminPage,
  })),
)
const TablesAdminPage = lazy(() =>
  import('../pages/admin/TablesAdminPage').then((module) => ({
    default: module.TablesAdminPage,
  })),
)
const ReportsPage = lazy(() =>
  import('../pages/admin/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
)
const StaffAdminPage = lazy(() =>
  import('../pages/admin/StaffAdminPage').then((module) => ({
    default: module.StaffAdminPage,
  })),
)
const SettingsAdminPage = lazy(() =>
  import('../pages/admin/SettingsAdminPage').then((module) => ({
    default: module.SettingsAdminPage,
  })),
)

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingState label="Loading…" />
        </div>
      }
    >
      {element}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 't/:token', element: <TableEntryPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:token', element: <OrderTrackingPage /> },
      { path: 'staff/login', element: <LoginPage /> },
    ],
  },
  {
    path: 'admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: 'orders', element: withSuspense(<OrdersPage />) },
          { path: 'orders/:id', element: withSuspense(<OrderDetailPage />) },
          {
            path: 'menu',
            element: withSuspense(
              <RoleGate capability="manage_menu">
                <MenuAdminPage />
              </RoleGate>,
            ),
          },
          {
            path: 'categories',
            element: withSuspense(
              <RoleGate capability="manage_menu">
                <CategoriesAdminPage />
              </RoleGate>,
            ),
          },
          {
            path: 'modifiers',
            element: withSuspense(
              <RoleGate capability="manage_menu">
                <ModifiersAdminPage />
              </RoleGate>,
            ),
          },
          {
            path: 'tables',
            element: withSuspense(
              <RoleGate capability="manage_tables">
                <TablesAdminPage />
              </RoleGate>,
            ),
          },
          {
            path: 'reports',
            element: withSuspense(
              <RoleGate capability="view_reports">
                <ReportsPage />
              </RoleGate>,
            ),
          },
          {
            path: 'staff',
            element: withSuspense(
              <RoleGate capability="manage_staff">
                <StaffAdminPage />
              </RoleGate>,
            ),
          },
          {
            path: 'settings',
            element: withSuspense(
              <RoleGate capability="manage_settings">
                <SettingsAdminPage />
              </RoleGate>,
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
