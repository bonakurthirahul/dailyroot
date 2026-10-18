import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import { useCart } from '../context'
import type { CartLine } from '../../../types/db'

function makeLine(overrides?: Partial<CartLine>): CartLine {
  return {
    uid: 'line-1',
    menu_item_id: 'item-latte',
    name: 'Latte',
    image_url: null,
    base_price: 210,
    variant_id: null,
    variant_name: null,
    variant_price_delta: 0,
    modifiers: [],
    unit_price: 210,
    quantity: 1,
    notes: null,
    ...overrides,
  }
}

function Harness() {
  const { lines, totals, addLine, updateQuantity, removeLine, clear } = useCart()
  return (
    <div>
      <span data-testid="count">{totals.itemCount}</span>
      <span data-testid="subtotal">{totals.subtotal}</span>
      <span data-testid="lines">{lines.length}</span>
      <button type="button" onClick={() => addLine(makeLine())}>
        add
      </button>
      <button type="button" onClick={() => addLine(makeLine({ uid: 'line-2' }))}>
        add-duplicate
      </button>
      <button
        type="button"
        onClick={() => updateQuantity('line-1', 3)}
      >
        set-three
      </button>
      <button type="button" onClick={() => removeLine('line-1')}>
        remove
      </button>
      <button type="button" onClick={clear}>
        clear
      </button>
    </div>
  )
}

describe('CartProvider', () => {
  it('merges identical lines into one with summed quantity', () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add-duplicate'))
    expect(screen.getByTestId('lines').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('subtotal').textContent).toBe('420')
  })

  it('updates quantity and recomputes totals', () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('set-three'))
    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('subtotal').textContent).toBe('630')
  })

  it('removes a line and clears the cart', () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('remove'))
    expect(screen.getByTestId('lines').textContent).toBe('0')

    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('clear'))
    expect(screen.getByTestId('lines').textContent).toBe('0')
  })
})
