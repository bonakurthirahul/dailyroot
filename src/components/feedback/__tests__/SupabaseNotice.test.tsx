import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SupabaseNotice } from '../SupabaseNotice'
import { BackendProvider } from '../../../features/backend/BackendProvider'
import { useBackend } from '../../../features/backend/context'

function Probe() {
  const { status, checking } = useBackend()
  return (
    <span data-testid="mode">
      {status.mode}:{String(checking)}
    </span>
  )
}

describe('SupabaseNotice (demo mode)', () => {
  it('shows the explicit demo-mode warning when unconfigured', () => {
    render(
      <BackendProvider>
        <SupabaseNotice />
      </BackendProvider>,
    )
    expect(screen.getByText(/local demo mode/i)).toBeInTheDocument()
    expect(screen.getByText(/are not live/i)).toBeInTheDocument()
  })
})

describe('BackendProvider', () => {
  it('reports demo mode immediately when Supabase is unconfigured', () => {
    render(
      <BackendProvider>
        <Probe />
      </BackendProvider>,
    )
    expect(screen.getByTestId('mode').textContent).toBe('demo:false')
  })
})
