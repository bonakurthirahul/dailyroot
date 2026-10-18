import { describe, expect, it } from 'vitest'
import {
  buildCartLine,
  computeCartTotals,
  computeUnitPrice,
  roundCurrency,
  validateCartLine,
  validateSelection,
} from '../pricing'
import type {
  MenuTreeItem,
  ModifierGroup,
  ModifierOption,
} from '../../types/db'

const option = (
  id: string,
  group_id: string,
  price_delta: number,
): ModifierOption => ({
  id,
  group_id,
  name: id,
  price_delta,
  is_available: true,
  sort_order: 1,
})

const requiredGroup: ModifierGroup & { options: ModifierOption[] } = {
  id: 'g-milk',
  name: 'Milk',
  selection_type: 'single',
  is_required: true,
  min_select: 1,
  max_select: 1,
  sort_order: 1,
  options: [option('o-whole', 'g-milk', 0), option('o-oat', 'g-milk', 30)],
}

const extrasGroup: ModifierGroup & { options: ModifierOption[] } = {
  id: 'g-extras',
  name: 'Extras',
  selection_type: 'multiple',
  is_required: false,
  min_select: 0,
  max_select: 2,
  sort_order: 2,
  options: [option('o-shot', 'g-extras', 50), option('o-cream', 'g-extras', 40)],
}

const menuItem: MenuTreeItem = {
  id: 'item-latte',
  category_id: 'cat-coffee',
  name: 'Latte',
  description: null,
  image_url: null,
  base_price: 200,
  is_available: true,
  is_featured: false,
  tags: [],
  sort_order: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  variants: [
    {
      id: 'v-reg',
      menu_item_id: 'item-latte',
      name: 'Regular',
      price_delta: 0,
      is_default: true,
      sort_order: 1,
    },
    {
      id: 'v-large',
      menu_item_id: 'item-latte',
      name: 'Large',
      price_delta: 40,
      is_default: false,
      sort_order: 2,
    },
  ],
  modifier_groups: [requiredGroup, extrasGroup],
}

describe('computeUnitPrice', () => {
  it('adds base price, variant delta and modifier deltas', () => {
    expect(
      computeUnitPrice({
        basePrice: 200,
        variantPriceDelta: 40,
        modifierDeltas: [30, 50],
      }),
    ).toBe(320)
  })

  it('defaults missing deltas to zero', () => {
    expect(computeUnitPrice({ basePrice: 140 })).toBe(140)
  })

  it('rounds to two decimal places', () => {
    expect(roundCurrency(10.005)).toBe(10.01)
  })
})

describe('buildCartLine', () => {
  it('recomputes the unit price from catalog values, not client input', () => {
    const line = buildCartLine({
      menuItem,
      variant: menuItem.variants[1]!,
      selectedOptions: [requiredGroup.options[1]!, extrasGroup.options[0]!],
      quantity: 2,
      uid: 'line-1',
    })
    expect(line.unit_price).toBe(320)
    expect(line.variant_name).toBe('Large')
    expect(line.modifiers).toHaveLength(2)
  })
})

describe('computeCartTotals', () => {
  it('sums line totals and item counts', () => {
    const line = buildCartLine({
      menuItem,
      variant: menuItem.variants[0]!,
      selectedOptions: [requiredGroup.options[0]!],
      quantity: 3,
      uid: 'line-1',
    })
    const totals = computeCartTotals([line])
    expect(totals.subtotal).toBe(600)
    expect(totals.itemCount).toBe(3)
    expect(totals.total).toBe(600)
  })

  it('applies tax only when enabled', () => {
    const line = buildCartLine({
      menuItem,
      variant: menuItem.variants[0]!,
      selectedOptions: [requiredGroup.options[0]!],
      quantity: 1,
      uid: 'line-1',
    })
    const withTax = computeCartTotals([line], {
      taxEnabled: true,
      taxRate: 5,
    })
    expect(withTax.tax_total).toBe(10)
    expect(withTax.total).toBe(210)

    const withoutTax = computeCartTotals([line], {
      taxEnabled: false,
      taxRate: 5,
    })
    expect(withoutTax.tax_total).toBe(0)
  })
})

describe('validateSelection', () => {
  it('flags a required single-choice group with no selection', () => {
    expect(validateSelection(requiredGroup, [])).toMatch(/at least/i)
  })

  it('allows a valid selection', () => {
    expect(validateSelection(requiredGroup, [requiredGroup.options[0]!])).toBeNull()
  })

  it('enforces max selections for multiple groups', () => {
    expect(
      validateSelection(extrasGroup, [
        extrasGroup.options[0]!,
        extrasGroup.options[1]!,
        option('o-extra', 'g-extras', 10),
      ]),
    ).toMatch(/at most/i)
  })
})

describe('validateCartLine', () => {
  it('passes when all required groups are satisfied', () => {
    expect(
      validateCartLine({
        menuItem,
        selectedOptions: [requiredGroup.options[0]!],
      }),
    ).toBeNull()
  })

  it('fails when a required group is missing', () => {
    expect(
      validateCartLine({ menuItem, selectedOptions: [] }),
    ).toMatch(/Milk/i)
  })
})
