import { cn } from '../../lib/cn'

interface ItemImageProps {
  src: string | null
  name: string
  className?: string
}

const GRADIENTS = [
  'from-coffee-500 to-espresso-800',
  'from-caramel-500 to-coffee-700',
  'from-coffee-400 to-espresso-900',
  'from-espresso-700 to-coffee-500',
]

function gradientFor(name: string): string {
  const index = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return GRADIENTS[index % GRADIENTS.length] ?? GRADIENTS[0]!
}

export function ItemImage({ src, name, className }: ItemImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn('size-full object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-full items-center justify-center bg-gradient-to-br',
        gradientFor(name),
        className,
      )}
    >
      <span className="font-display text-3xl text-cream-100/90">
        {name.charAt(0).toUpperCase()}
      </span>
    </span>
  )
}
