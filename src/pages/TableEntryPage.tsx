import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { MenuBrowser } from '../features/menu/MenuBrowser'
import { useTableContext } from '../features/table/context'
import { resolveTableByToken } from '../services/menu'
import { validateTrackingToken } from '../lib/orders'

type Status = 'loading' | 'ready' | 'invalid' | 'error'

export function TableEntryPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const { table, setTable } = useTableContext()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const clean = token?.trim() ?? ''

    if (!validateTrackingToken(clean)) {
      setStatus('invalid')
      return
    }

    setStatus('loading')
    resolveTableByToken(clean)
      .then((resolved) => {
        if (!active) return
        if (!resolved) {
          setStatus('invalid')
          return
        }
        setTable(resolved, clean)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Unable to load table')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [token, setTable])

  if (status === 'loading') {
    return (
      <Container className="py-16">
        <LoadingState label="Finding your table…" />
      </Container>
    )
  }

  if (status === 'invalid') {
    return (
      <Container className="py-16">
        <EmptyState
          title="This table QR isn't valid"
          description="The code may be old or damaged. You can still browse the menu, or ask a staff member for help."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/menu')}>Browse menu</Button>
              <Link
                to="/"
                className="rounded-full border border-coffee-600/30 px-5 py-2.5 text-sm font-medium text-espresso-900"
              >
                Back home
              </Link>
            </div>
          }
        />
      </Container>
    )
  }

  if (status === 'error') {
    return (
      <Container className="py-16">
        <ErrorState
          title="We couldn't reach the ordering service"
          description={error ?? undefined}
          onRetry={() => navigate(0)}
        />
      </Container>
    )
  }

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <div className="flex flex-col gap-2 rounded-2xl border border-emerald-600/20 bg-emerald-50/70 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-900">
          You're ordering for {table?.label}
          {table?.zone ? ` · ${table.zone}` : ''}
        </p>
        <p className="text-xs text-emerald-900/70">
          Your order will be delivered to this table.
        </p>
      </div>
      <MenuBrowser tableLabel={table?.label ?? null} />
    </Container>
  )
}
