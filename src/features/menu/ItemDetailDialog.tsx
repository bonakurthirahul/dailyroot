import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { ItemImage } from '../../components/ui/ItemImage'
import { formatCurrency } from '../../lib/format'
import { buildCartLine, computeUnitPrice } from '../../lib/pricing'
import { cn } from '../../lib/cn'
import type { CartLine, MenuTreeItem, ModifierOption } from '../../types/db'

interface ItemDetailDialogProps {
  item: MenuTreeItem | null
  open: boolean
  onClose: () => void
  onAdd: (line: CartLine) => void
}

function makeUid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function ItemDetailDialog({
  item,
  open,
  onClose,
  onAdd,
}: ItemDetailDialogProps) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    const defaultVariant =
      item.variants.find((variant) => variant.is_default) ??
      item.variants[0] ??
      null
    setVariantId(defaultVariant?.id ?? null)
    setSelectedIds(
      item.modifier_groups.flatMap((group) =>
        group.is_required && group.min_select > 0 && group.options[0]
          ? [group.options[0].id]
          : [],
      ),
    )
    setQuantity(1)
    setNotes('')
    setError(null)
  }, [item])

  const selectedOptions = useMemo<ModifierOption[]>(() => {
    if (!item) return []
    return item.modifier_groups.flatMap((group) =>
      group.options.filter((option) => selectedIds.includes(option.id)),
    )
  }, [item, selectedIds])

  const variant = useMemo(
    () => item?.variants.find((candidate) => candidate.id === variantId) ?? null,
    [item, variantId],
  )

  const unitPrice = useMemo(() => {
    if (!item) return 0
    return computeUnitPrice({
      basePrice: item.base_price,
      variantPriceDelta: variant?.price_delta,
      modifierDeltas: selectedOptions.map((option) => option.price_delta),
    })
  }, [item, variant, selectedOptions])

  if (!item) return null

  function toggleOption(option: ModifierOption, single: boolean) {
    setSelectedIds((current) => {
      if (single) return [...current.filter((id) => id !== option.id), option.id]
      return current.includes(option.id)
        ? current.filter((id) => id !== option.id)
        : [...current, option.id]
    })
  }

  function handleAdd() {
    if (!item) return
    for (const group of item.modifier_groups) {
      const selectedForGroup = selectedOptions.filter((option) =>
        group.options.some((candidate) => candidate.id === option.id),
      )
      if (group.is_required && selectedForGroup.length < Math.max(1, group.min_select)) {
        setError(`Please choose an option for "${group.name}".`)
        return
      }
      if (group.max_select != null && selectedForGroup.length > group.max_select) {
        setError(`"${group.name}" allows at most ${group.max_select} selections.`)
        return
      }
    }

    const line = buildCartLine({
      menuItem: item,
      variant,
      selectedOptions,
      quantity,
      notes,
      uid: makeUid(),
    })
    onAdd(line)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={item.name} size="md">
      <div className="flex flex-col gap-5">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <ItemImage src={item.image_url} name={item.name} />
        </div>
        {item.description ? (
          <p className="text-sm leading-relaxed text-coffee-700/90">
            {item.description}
          </p>
        ) : null}

        {item.variants.length > 1 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-coffee-600">
              Size
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVariantId(option.id)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition',
                    variantId === option.id
                      ? 'border-espresso-900 bg-espresso-900 text-cream-50'
                      : 'border-coffee-600/30 text-espresso-800 hover:border-coffee-600',
                  )}
                >
                  {option.name}
                  {option.price_delta > 0
                    ? ` · +${formatCurrency(option.price_delta)}`
                    : ''}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {item.modifier_groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-coffee-600">
                {group.name}
              </h3>
              {group.is_required ? (
                <span className="rounded-full bg-caramel-400/25 px-2 py-0.5 text-[0.7rem] font-semibold text-coffee-700">
                  Required
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = selectedIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!option.is_available}
                    onClick={() =>
                      toggleOption(option, group.selection_type === 'single')
                    }
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40',
                      active
                        ? 'border-espresso-900 bg-espresso-900 text-cream-50'
                        : 'border-coffee-600/30 text-espresso-800 hover:border-coffee-600',
                    )}
                  >
                    {option.name}
                    {option.price_delta > 0
                      ? ` · +${formatCurrency(option.price_delta)}`
                      : ''}
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-2">
          <label
            htmlFor="item-notes"
            className="text-sm font-semibold uppercase tracking-wide text-coffee-600"
          >
            Special instructions
          </label>
          <textarea
            id="item-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="e.g. extra hot, no sugar"
            className="rounded-xl border border-coffee-600/20 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-coffee-600"
          />
        </section>

        {error ? (
          <p role="alert" className="text-sm font-medium text-berry-500">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-coffee-600/10 pt-4">
        <div className="flex items-center rounded-full border border-coffee-600/25">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-3.5 py-2 text-lg text-espresso-800"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            className="px-3.5 py-2 text-lg text-espresso-800"
          >
            +
          </button>
        </div>
        <Button className="flex-1" size="lg" onClick={handleAdd}>
          Add · {formatCurrency(unitPrice * quantity)}
        </Button>
      </div>
    </Modal>
  )
}
