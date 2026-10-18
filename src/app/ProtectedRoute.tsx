import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '../features/auth/context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-20">
        <LoadingState label="Checking your session…" />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate to="/staff/login" replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
