import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../features/auth/context'
import { DEMO_ACCOUNTS } from '../../services/auth'
import { isSupabaseConfigured } from '../../lib/env'
import { ROLE_LABELS } from '../../types/db'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/admin'} replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/admin', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemoAccount(accountEmail: string, pin: string) {
    setEmail(accountEmail)
    setPassword(pin)
  }

  return (
    <Container className="flex justify-center py-14">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-5 rounded-2xl border border-coffee-600/10 bg-cream-50/90 p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl text-espresso-900">
              Staff sign in
            </h1>
            <p className="text-sm text-coffee-700">
              {isSupabaseConfigured
                ? 'Sign in with your staff account.'
                : 'Demo mode — sign in with a sample staff account below.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-espresso-900">
                {isSupabaseConfigured ? 'Password' : 'PIN'}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2.5 outline-none focus:border-coffee-600"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm font-medium text-berry-500">
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={submitting} size="lg">
              Sign in
            </Button>
          </form>

          {!isSupabaseConfigured ? (
            <div className="flex flex-col gap-2 border-t border-coffee-600/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-coffee-500">
                Demo accounts (PIN in brackets)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoAccount(account.email, account.pin)}
                    className="rounded-xl border border-coffee-600/20 px-3 py-2 text-left text-xs transition hover:border-coffee-600"
                  >
                    <span className="block font-semibold text-espresso-900">
                      {ROLE_LABELS[account.role]}
                    </span>
                    <span className="block text-coffee-600">
                      {account.email}
                    </span>
                    <span className="block text-coffee-500">
                      PIN {account.pin}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  )
}
