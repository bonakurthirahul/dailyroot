import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import { useCart } from '../../features/cart/context'
import { cn } from '../../lib/cn'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu', end: false },
]

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center rounded-full bg-espresso-900 font-display text-lg text-cream-50"
    >
      B
    </span>
  )
}

export function SiteHeader() {
  const navigate = useNavigate()
  const { totals } = useCart()

  return (
    <header className="sticky top-0 z-30 border-b border-coffee-600/10 bg-cream-100/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3">
        <NavLink
          to="/"
          className="flex items-center gap-3"
          aria-label="Brew and Bean home"
        >
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg text-espresso-900">
              Brew &amp; Bean
            </span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-coffee-500 sm:block">
              Table Ordering
            </span>
          </span>
        </NavLink>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cream-200 text-espresso-900'
                    : 'text-coffee-700 hover:bg-cream-200/70 hover:text-espresso-900',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/staff/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-coffee-700 hover:text-espresso-900 md:inline-flex"
          >
            Staff
          </NavLink>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cart')}
            rightIcon={
              totals.itemCount > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-coffee-600 text-[0.7rem] font-semibold text-cream-50">
                  {totals.itemCount}
                </span>
              ) : undefined
            }
          >
            Cart
          </Button>
        </div>
      </Container>
    </header>
  )
}
