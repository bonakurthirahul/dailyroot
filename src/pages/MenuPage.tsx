import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { MenuBrowser } from '../features/menu/MenuBrowser'
import { useTableContext } from '../features/table/context'

export function MenuPage() {
  const { table } = useTableContext()

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <SectionHeading
        eyebrow="Our menu"
        title="Crafted coffee & kitchen favourites"
        description="Everything is made to order. Choose your size, milk and add-ons to make it yours."
      />
      <MenuBrowser tableLabel={table?.label ?? null} />
    </Container>
  )
}
