export type StaffRole = 'owner' | 'manager' | 'cashier' | 'kitchen'

export const STAFF_ROLES: StaffRole[] = [
  'owner',
  'manager',
  'cashier',
  'kitchen',
]

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  kitchen: 'Kitchen',
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'cancelled',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: [],
}

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed'

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  failed: 'Failed',
}

export type PaymentMethod = 'upi' | 'counter'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  counter: 'Pay at counter',
}

export type SelectionType = 'single' | 'multiple'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  image_url: string | null
  base_price: number
  is_available: boolean
  is_featured: boolean
  tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Variant {
  id: string
  menu_item_id: string
  name: string
  price_delta: number
  is_default: boolean
  sort_order: number
}

export interface ModifierGroup {
  id: string
  name: string
  selection_type: SelectionType
  is_required: boolean
  min_select: number
  max_select: number | null
  sort_order: number
}

export interface ModifierOption {
  id: string
  group_id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
}

export interface MenuItemModifierGroup {
  menu_item_id: string
  group_id: string
  sort_order: number
}

export interface CafeTable {
  id: string
  label: string
  token: string
  seats: number
  zone: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  reference: string
  tracking_token: string
  table_id: string | null
  table_label: string | null
  customer_name: string
  customer_phone: string | null
  notes: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  subtotal: number
  tax_total: number
  discount_total: number
  total: number
  placed_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  name_snapshot: string
  variant_name: string | null
  unit_price: number
  quantity: number
  line_total: number
  notes: string | null
}

export interface OrderItemModifier {
  id: string
  order_item_id: string
  group_name: string
  option_name: string
  price_delta: number
}

export interface OrderStatusEvent {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_by: string | null
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  reference: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
}

export interface CafeSetting {
  id: string
  cafe_name: string
  tagline: string | null
  address: string | null
  phone: string | null
  upi_id: string | null
  currency: string
  tax_enabled: boolean
  tax_rate: number
  tax_label: string
  service_charge_enabled: boolean
  service_charge_rate: number
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_name: string | null
  action: string
  entity: string
  entity_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
}

export interface MenuTreeItem extends MenuItem {
  variants: Variant[]
  modifier_groups: Array<ModifierGroup & { options: ModifierOption[] }>
}

export interface OrderWithItems extends Order {
  items: Array<OrderItem & { modifiers: OrderItemModifier[] }>
  events: OrderStatusEvent[]
  payments: Payment[]
}

export interface CartModifier {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta: number
}

export interface CartLine {
  uid: string
  menu_item_id: string
  name: string
  image_url: string | null
  base_price: number
  variant_id: string | null
  variant_name: string | null
  variant_price_delta: number
  modifiers: CartModifier[]
  unit_price: number
  quantity: number
  notes: string | null
}

export interface CartTotals {
  subtotal: number
  tax_total: number
  total: number
  itemCount: number
}
