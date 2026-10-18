import type {
  CartLine,
  CartModifier,
  CartTotals,
  MenuTreeItem,
  ModifierGroup,
  ModifierOption,
  Variant,
} from '../types/db'

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeUnitPrice(input: {
  basePrice: number
  variantPriceDelta?: number
  modifierDeltas?: number[]
}): number {
  const variantDelta = input.variantPriceDelta ?? 0
  const modifierTotal = (input.modifierDeltas ?? []).reduce(
    (sum, delta) => sum + delta,
    0,
  )
  return roundCurrency(input.basePrice + variantDelta + modifierTotal)
}

export function computeLineTotal(line: CartLine): number {
  return roundCurrency(line.unit_price * line.quantity)
}

export function computeCartTotals(
  lines: CartLine[],
  options?: { taxEnabled?: boolean; taxRate?: number },
): CartTotals {
  const subtotal = roundCurrency(
    lines.reduce((sum, line) => sum + computeLineTotal(line), 0),
  )
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  const taxEnabled = options?.taxEnabled ?? false
  const taxRate = options?.taxRate ?? 0
  const tax_total =
    taxEnabled && taxRate > 0 ? roundCurrency(subtotal * (taxRate / 100)) : 0

  return {
    subtotal,
    tax_total,
    total: roundCurrency(subtotal + tax_total),
    itemCount,
  }
}

export function buildCartLine(input: {
  menuItem: MenuTreeItem
  variant: Variant | null
  selectedOptions: ModifierOption[]
  quantity: number
  notes?: string | null
  uid: string
}): CartLine {
  const { menuItem, variant, selectedOptions, quantity, notes, uid } = input
  const modifiers: CartModifier[] = selectedOptions.map((option) => {
    const group = menuItem.modifier_groups.find((candidate) =>
      candidate.options.some((entry) => entry.id === option.id),
    )
    return {
      group_id: group?.id ?? '',
      group_name: group?.name ?? '',
      option_id: option.id,
      option_name: option.name,
      price_delta: option.price_delta,
    }
  })

  return {
    uid,
    menu_item_id: menuItem.id,
    name: menuItem.name,
    image_url: menuItem.image_url,
    base_price: menuItem.base_price,
    variant_id: variant?.id ?? null,
    variant_name: variant?.name ?? null,
    variant_price_delta: variant?.price_delta ?? 0,
    modifiers,
    unit_price: computeUnitPrice({
      basePrice: menuItem.base_price,
      variantPriceDelta: variant?.price_delta,
      modifierDeltas: modifiers.map((modifier) => modifier.price_delta),
    }),
    quantity,
    notes: notes?.trim() ? notes.trim() : null,
  }
}

export function validateSelection(
  group: ModifierGroup,
  selected: ModifierOption[],
): string | null {
  const count = selected.length

  if (group.is_required && count < Math.max(1, group.min_select)) {
    return `${group.name} requires at least ${Math.max(1, group.min_select)} selection`
  }

  if (group.min_select > 0 && count < group.min_select) {
    return `${group.name} requires at least ${group.min_select} selection(s)`
  }

  if (group.max_select != null && count > group.max_select) {
    return `${group.name} allows at most ${group.max_select} selection(s)`
  }

  if (group.selection_type === 'single' && count > 1) {
    return `${group.name} allows only one selection`
  }

  return null
}

export function validateCartLine(input: {
  menuItem: MenuTreeItem
  selectedOptions: ModifierOption[]
}): string | null {
  const { menuItem, selectedOptions } = input

  for (const group of menuItem.modifier_groups) {
    const selectedForGroup = selectedOptions.filter((option) =>
      group.options.some((candidate) => candidate.id === option.id),
    )
    const error = validateSelection(group, selectedForGroup)
    if (error) return error
  }

  return null
}
