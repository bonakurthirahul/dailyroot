import type {
  Category,
  MenuItem,
  MenuItemModifierGroup,
  ModifierGroup,
  ModifierOption,
  Variant,
} from '../../types/db'

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-coffee',
    name: 'Coffee',
    slug: 'coffee',
    description: 'Slow-roasted espresso classics, pulled to order.',
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-cold',
    name: 'Cold Brew & Iced',
    slug: 'cold-brew-iced',
    description: 'Chilled, smooth and refreshing.',
    sort_order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-tea',
    name: 'Tea & Chai',
    slug: 'tea-chai',
    description: 'Spiced brews and comforting cups.',
    sort_order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-food',
    name: 'Breakfast & Bites',
    slug: 'breakfast-bites',
    description: 'Freshly prepared light meals and snacks.',
    sort_order: 4,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-dessert',
    name: 'Desserts',
    slug: 'desserts',
    description: 'Sweet finishes from our pastry counter.',
    sort_order: 5,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export const DEMO_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'mg-milk',
    name: 'Milk choice',
    selection_type: 'single',
    is_required: true,
    min_select: 1,
    max_select: 1,
    sort_order: 1,
  },
  {
    id: 'mg-sugar',
    name: 'Sugar level',
    selection_type: 'single',
    is_required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 2,
  },
  {
    id: 'mg-shots',
    name: 'Extra shots',
    selection_type: 'multiple',
    is_required: false,
    min_select: 0,
    max_select: 3,
    sort_order: 3,
  },
  {
    id: 'mg-toppings',
    name: 'Toppings',
    selection_type: 'multiple',
    is_required: false,
    min_select: 0,
    max_select: 4,
    sort_order: 4,
  },
  {
    id: 'mg-sweetness',
    name: 'Sweetness',
    selection_type: 'single',
    is_required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 5,
  },
  {
    id: 'mg-ice',
    name: 'Ice level',
    selection_type: 'single',
    is_required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 6,
  },
  {
    id: 'mg-addons',
    name: 'Add-ons',
    selection_type: 'multiple',
    is_required: false,
    min_select: 0,
    max_select: 4,
    sort_order: 7,
  },
  {
    id: 'mg-sides',
    name: 'Choose a side',
    selection_type: 'single',
    is_required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 8,
  },
  {
    id: 'mg-spread',
    name: 'Spread',
    selection_type: 'single',
    is_required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 9,
  },
  {
    id: 'mg-dessert-topping',
    name: 'Dessert topping',
    selection_type: 'multiple',
    is_required: false,
    min_select: 0,
    max_select: 2,
    sort_order: 10,
  },
]

export const DEMO_MODIFIER_OPTIONS: ModifierOption[] = [
  { id: 'mo-milk-whole', group_id: 'mg-milk', name: 'Whole milk', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-milk-skim', group_id: 'mg-milk', name: 'Skim milk', price_delta: 0, is_available: true, sort_order: 2 },
  { id: 'mo-milk-oat', group_id: 'mg-milk', name: 'Oat milk', price_delta: 30, is_available: true, sort_order: 3 },
  { id: 'mo-milk-almond', group_id: 'mg-milk', name: 'Almond milk', price_delta: 30, is_available: true, sort_order: 4 },
  { id: 'mo-milk-soy', group_id: 'mg-milk', name: 'Soy milk', price_delta: 30, is_available: true, sort_order: 5 },

  { id: 'mo-sugar-none', group_id: 'mg-sugar', name: 'No sugar', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-sugar-less', group_id: 'mg-sugar', name: 'Less sugar', price_delta: 0, is_available: true, sort_order: 2 },
  { id: 'mo-sugar-normal', group_id: 'mg-sugar', name: 'Normal sugar', price_delta: 0, is_available: true, sort_order: 3 },

  { id: 'mo-shot-extra', group_id: 'mg-shots', name: 'Extra espresso shot', price_delta: 50, is_available: true, sort_order: 1 },
  { id: 'mo-shot-decaf', group_id: 'mg-shots', name: 'Decaf shot', price_delta: 0, is_available: true, sort_order: 2 },

  { id: 'mo-top-cream', group_id: 'mg-toppings', name: 'Whipped cream', price_delta: 40, is_available: true, sort_order: 1 },
  { id: 'mo-top-choc', group_id: 'mg-toppings', name: 'Chocolate drizzle', price_delta: 30, is_available: true, sort_order: 2 },
  { id: 'mo-top-cinnamon', group_id: 'mg-toppings', name: 'Cinnamon dust', price_delta: 20, is_available: true, sort_order: 3 },
  { id: 'mo-top-caramel', group_id: 'mg-toppings', name: 'Caramel drizzle', price_delta: 30, is_available: true, sort_order: 4 },

  { id: 'mo-sweet-none', group_id: 'mg-sweetness', name: 'Unsweetened', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-sweet-light', group_id: 'mg-sweetness', name: 'Light', price_delta: 0, is_available: true, sort_order: 2 },
  { id: 'mo-sweet-regular', group_id: 'mg-sweetness', name: 'Regular', price_delta: 0, is_available: true, sort_order: 3 },
  { id: 'mo-sweet-extra', group_id: 'mg-sweetness', name: 'Extra sweet', price_delta: 0, is_available: true, sort_order: 4 },

  { id: 'mo-ice-none', group_id: 'mg-ice', name: 'No ice', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-ice-less', group_id: 'mg-ice', name: 'Less ice', price_delta: 0, is_available: true, sort_order: 2 },
  { id: 'mo-ice-regular', group_id: 'mg-ice', name: 'Regular ice', price_delta: 0, is_available: true, sort_order: 3 },
  { id: 'mo-ice-extra', group_id: 'mg-ice', name: 'Extra ice', price_delta: 0, is_available: true, sort_order: 4 },

  { id: 'mo-add-cheese', group_id: 'mg-addons', name: 'Extra cheese', price_delta: 50, is_available: true, sort_order: 1 },
  { id: 'mo-add-egg', group_id: 'mg-addons', name: 'Add egg', price_delta: 40, is_available: true, sort_order: 2 },
  { id: 'mo-add-paneer', group_id: 'mg-addons', name: 'Grilled paneer', price_delta: 60, is_available: true, sort_order: 3 },
  { id: 'mo-add-avocado', group_id: 'mg-addons', name: 'Avocado', price_delta: 70, is_available: true, sort_order: 4 },

  { id: 'mo-side-none', group_id: 'mg-sides', name: 'No side', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-side-wedges', group_id: 'mg-sides', name: 'Potato wedges', price_delta: 70, is_available: true, sort_order: 2 },
  { id: 'mo-side-salad', group_id: 'mg-sides', name: 'Side salad', price_delta: 60, is_available: true, sort_order: 3 },
  { id: 'mo-side-dip', group_id: 'mg-sides', name: 'Ketchup dip', price_delta: 20, is_available: true, sort_order: 4 },

  { id: 'mo-spread-plain', group_id: 'mg-spread', name: 'Plain', price_delta: 0, is_available: true, sort_order: 1 },
  { id: 'mo-spread-butter', group_id: 'mg-spread', name: 'Salted butter', price_delta: 20, is_available: true, sort_order: 2 },
  { id: 'mo-spread-jam', group_id: 'mg-spread', name: 'Strawberry jam', price_delta: 30, is_available: true, sort_order: 3 },
  { id: 'mo-spread-honey', group_id: 'mg-spread', name: 'Honey', price_delta: 30, is_available: true, sort_order: 4 },

  { id: 'mo-dtop-icecream', group_id: 'mg-dessert-topping', name: 'Vanilla ice cream', price_delta: 60, is_available: true, sort_order: 1 },
  { id: 'mo-dtop-choc', group_id: 'mg-dessert-topping', name: 'Chocolate sauce', price_delta: 30, is_available: true, sort_order: 2 },
  { id: 'mo-dtop-espresso', group_id: 'mg-dessert-topping', name: 'Espresso shot', price_delta: 50, is_available: true, sort_order: 3 },
]

interface ItemSeed {
  id: string
  category_id: string
  name: string
  description: string
  base_price: number
  tags: string[]
  is_featured?: boolean
  is_available?: boolean
  variants?: Array<[string, number]>
  groups?: string[]
}

const ITEM_SEEDS: ItemSeed[] = [
  { id: 'item-espresso', category_id: 'cat-coffee', name: 'Double Espresso', description: 'Rich, syrupy double shot with a chocolate finish.', base_price: 140, tags: ['Signature'], groups: ['mg-sugar', 'mg-shots'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-americano', category_id: 'cat-coffee', name: 'Americano', description: 'Espresso lengthened with hot water for a clean cup.', base_price: 160, tags: ['Classic'], groups: ['mg-milk', 'mg-sugar', 'mg-shots'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-cappuccino', category_id: 'cat-coffee', name: 'Cappuccino', description: 'Balanced espresso with velvety steamed milk foam.', base_price: 190, tags: ['Bestseller'], is_featured: true, groups: ['mg-milk', 'mg-sugar', 'mg-shots', 'mg-toppings'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-latte', category_id: 'cat-coffee', name: 'Cafe Latte', description: 'Smooth espresso folded into silky microfoam.', base_price: 210, tags: ['Bestseller'], is_featured: true, groups: ['mg-milk', 'mg-sugar', 'mg-shots', 'mg-toppings'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-flat-white', category_id: 'cat-coffee', name: 'Flat White', description: 'Two ristretto shots topped with thin, glossy milk.', base_price: 220, tags: ['Chef pick'], groups: ['mg-milk', 'mg-sugar', 'mg-shots'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-mocha', category_id: 'cat-coffee', name: 'Cafe Mocha', description: 'Espresso with dark cocoa and steamed milk.', base_price: 240, tags: ['Indulgent'], groups: ['mg-milk', 'mg-sugar', 'mg-shots', 'mg-toppings'], variants: [['Regular', 0], ['Large', 40]] },

  { id: 'item-cold-brew', category_id: 'cat-cold', name: 'Cold Brew', description: 'Steeped 18 hours for a smooth, low-acid pour.', base_price: 220, tags: ['Signature'], is_featured: true, groups: ['mg-milk', 'mg-sweetness', 'mg-ice'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-iced-latte', category_id: 'cat-cold', name: 'Iced Latte', description: 'Chilled espresso with cold milk over ice.', base_price: 210, tags: ['Refreshing'], groups: ['mg-milk', 'mg-sweetness', 'mg-ice'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-iced-americano', category_id: 'cat-cold', name: 'Iced Americano', description: 'Bright espresso over ice with a citrus edge.', base_price: 170, tags: ['Light'], groups: ['mg-milk', 'mg-sweetness', 'mg-ice'], variants: [['Regular', 0], ['Large', 40]] },
  { id: 'item-frappe', category_id: 'cat-cold', name: 'Cold Coffee Frappe', description: 'Blended coffee, milk and ice with a whipped top.', base_price: 250, tags: ['Indulgent'], groups: ['mg-sweetness', 'mg-toppings'], variants: [['Regular', 0], ['Large', 50]] },

  { id: 'item-masala-chai', category_id: 'cat-tea', name: 'Masala Chai', description: 'Assam tea simmered with ginger, cardamom and clove.', base_price: 120, tags: ['House brew'], groups: ['mg-milk', 'mg-sugar'], variants: [['Regular', 0], ['Large', 30]] },
  { id: 'item-green-tea', category_id: 'cat-tea', name: 'Green Tea', description: 'Delicate whole-leaf green tea, lightly floral.', base_price: 130, tags: ['Light'], groups: ['mg-sugar', 'mg-spread'], variants: [['Regular', 0], ['Large', 30]] },
  { id: 'item-hot-chocolate', category_id: 'cat-tea', name: 'Belgian Hot Chocolate', description: 'Melted dark chocolate with steamed milk.', base_price: 200, tags: ['Indulgent'], groups: ['mg-milk', 'mg-toppings'], variants: [['Regular', 0], ['Large', 40]] },

  { id: 'item-croissant', category_id: 'cat-food', name: 'Butter Croissant', description: 'Flaky 27-layer croissant baked every morning.', base_price: 160, tags: ['Fresh bake'], is_featured: true, groups: ['mg-spread'] },
  { id: 'item-club-sandwich', category_id: 'cat-food', name: 'Veg Club Sandwich', description: 'Triple-decker with grilled veggies and aioli.', base_price: 260, tags: ['Hearty'], groups: ['mg-addons', 'mg-sides'], variants: [['Half', 0], ['Full', 90]] },
  { id: 'item-paneer-wrap', category_id: 'cat-food', name: 'Tandoori Paneer Wrap', description: 'Smoky paneer, peppers and mint chutney in a warm wrap.', base_price: 240, tags: ['Spicy'], groups: ['mg-addons', 'mg-sides'], variants: [['Half', 0], ['Full', 80]] },
  { id: 'item-avocado-toast', category_id: 'cat-food', name: 'Smashed Avocado Toast', description: 'Sourdough, smashed avocado, chilli and lime.', base_price: 290, tags: ['Chef pick'], is_featured: true, groups: ['mg-addons'] },

  { id: 'item-tiramisu', category_id: 'cat-dessert', name: 'Classic Tiramisu', description: 'Espresso-soaked sponge with mascarpone cream.', base_price: 280, tags: ['Bestseller'], is_featured: true, groups: ['mg-dessert-topping'] },
  { id: 'item-brownie', category_id: 'cat-dessert', name: 'Fudge Brownie', description: 'Warm, gooey brownie with a crackled top.', base_price: 200, tags: ['Warm'], groups: ['mg-dessert-topping'] },
  { id: 'item-cheesecake', category_id: 'cat-dessert', name: 'Blueberry Cheesecake', description: 'Baked cheesecake with a wild blueberry compote.', base_price: 300, tags: ['Chilled'], groups: ['mg-dessert-topping'] },
]

export const DEMO_MENU_ITEMS: MenuItem[] = ITEM_SEEDS.map((seed, index) => ({
  id: seed.id,
  category_id: seed.category_id,
  name: seed.name,
  description: seed.description,
  image_url: null,
  base_price: seed.base_price,
  is_available: seed.is_available ?? true,
  is_featured: seed.is_featured ?? false,
  tags: seed.tags,
  sort_order: index + 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}))

export const DEMO_VARIANTS: Variant[] = ITEM_SEEDS.flatMap((seed) =>
  (seed.variants ?? []).map(([name, delta], index) => ({
    id: `${seed.id}--${name.toLowerCase().replace(/\s+/g, '-')}`,
    menu_item_id: seed.id,
    name,
    price_delta: delta,
    is_default: index === 0,
    sort_order: index + 1,
  })),
)

export const DEMO_ITEM_GROUPS: MenuItemModifierGroup[] = ITEM_SEEDS.flatMap(
  (seed) =>
    (seed.groups ?? []).map((group_id, index) => ({
      menu_item_id: seed.id,
      group_id,
      sort_order: index + 1,
    })),
)
