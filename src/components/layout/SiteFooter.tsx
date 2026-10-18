import { Container } from '../ui/Container'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-coffee-600/10 bg-espresso-950 text-cream-200">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xl text-cream-50">
            Brew &amp; Bean
          </span>
          <span className="text-sm text-cream-300/70">
            Scan · Order · Savour · Pay from your table.
          </span>
        </div>
        <p className="text-xs text-cream-300/60">
          © {new Date().getFullYear()} Brew &amp; Bean Cafe. All rights
          reserved.
        </p>
      </Container>
    </footer>
  )
}
