import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MenuBrowser } from '../MenuBrowser'
import { renderWithProviders } from '../../../test/test-utils'
import { resetState } from '../../../data/local/store'

beforeEach(() => {
  resetState()
})

describe('MenuBrowser', () => {
  it('shows a loading state first, then the menu', async () => {
    renderWithProviders(<MenuBrowser />)
    expect(screen.getByText(/brewing the menu/i)).toBeInTheDocument()
    expect(await screen.findByText('Cafe Latte')).toBeInTheDocument()
  })

  it('filters items by search and shows an empty state', async () => {
    renderWithProviders(<MenuBrowser />)
    await screen.findByText('Cafe Latte')

    fireEvent.change(screen.getByRole('searchbox', {
      name: 'Search the menu',
    }), {
      target: { value: 'zzzznotathing' },
    })

    expect(await screen.findByText(/no items found/i)).toBeInTheDocument()
  })

  it('filters to a single category', async () => {
    renderWithProviders(<MenuBrowser />)
    await screen.findByText('Cafe Latte')

    fireEvent.click(screen.getByRole('tab', { name: 'Desserts' }))

    expect(await screen.findByText('Classic Tiramisu')).toBeInTheDocument()
    expect(screen.queryByText('Cafe Latte')).not.toBeInTheDocument()
  })
})
