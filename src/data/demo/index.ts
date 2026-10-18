import type {
  CafeSetting,
  CafeTable,
  MenuTreeItem,
} from '../../types/db'
import {
  DEMO_CATEGORIES,
  DEMO_ITEM_GROUPS,
  DEMO_MENU_ITEMS,
  DEMO_MODIFIER_GROUPS,
  DEMO_MODIFIER_OPTIONS,
  DEMO_VARIANTS,
} from './catalog'

export {
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  DEMO_MODIFIER_GROUPS,
  DEMO_MODIFIER_OPTIONS,
  DEMO_VARIANTS,
  DEMO_ITEM_GROUPS,
}

export function buildDemoMenuTree(): MenuTreeItem[] {
  return DEMO_MENU_ITEMS.map((item) => {
    const variants = DEMO_VARIANTS.filter(
      (variant) => variant.menu_item_id === item.id,
    ).sort((a, b) => a.sort_order - b.sort_order)

    const groups = DEMO_ITEM_GROUPS.filter(
      (link) => link.menu_item_id === item.id,
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((link) => {
        const group = DEMO_MODIFIER_GROUPS.find(
          (candidate) => candidate.id === link.group_id,
        )
        if (!group) return []
        return [
          {
            ...group,
            options: DEMO_MODIFIER_OPTIONS.filter(
              (option) => option.group_id === group.id,
            ).sort((a, b) => a.sort_order - b.sort_order),
          },
        ]
      })

    return { ...item, variants, modifier_groups: groups }
  })
}

export const DEMO_TABLES: CafeTable[] = Array.from({ length: 12 }).map(
  (_, index) => {
    const number = index + 1
    const zone =
      number <= 4 ? 'Window' : number <= 8 ? 'Main hall' : 'Terrace'
    return {
      id: `table-${number}`,
      label: `Table ${number}`,
      token: `DEMOTABLE${String(number).padStart(2, '0')}XXXXXXXX`,
      seats: number % 3 === 0 ? 4 : 2,
      zone,
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    }
  },
)

export const DEMO_SETTINGS: CafeSetting = {
  id: 'default',
  cafe_name: 'Brew & Bean',
  tagline: 'Small-batch roastery & kitchen',
  address: '14 Roastery Lane, Indiranagar, Bengaluru',
  phone: '+91 90000 00000',
  upi_id: null,
  currency: 'INR',
  tax_enabled: false,
  tax_rate: 0,
  tax_label: 'GST',
  service_charge_enabled: false,
  service_charge_rate: 0,
  updated_at: '2026-01-01T00:00:00.000Z',
}

export interface DemoStaff {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'manager' | 'cashier' | 'kitchen'
  is_active: boolean
  pin: string
}

export const DEMO_STAFF: DemoStaff[] = [
  {
    id: 'staff-owner',
    full_name: 'Aarav Owner',
    email: 'owner@brewandbean.test',
    role: 'owner',
    is_active: true,
    pin: '2468',
  },
  {
    id: 'staff-manager',
    full_name: 'Meera Manager',
    email: 'manager@brewandbean.test',
    role: 'manager',
    is_active: true,
    pin: '1357',
  },
  {
    id: 'staff-cashier',
    full_name: 'Kabir Cashier',
    email: 'cashier@brewandbean.test',
    role: 'cashier',
    is_active: true,
    pin: '1122',
  },
  {
    id: 'staff-kitchen',
    full_name: 'Diya Kitchen',
    email: 'kitchen@brewandbean.test',
    role: 'kitchen',
    is_active: true,
    pin: '3344',
  },
]
