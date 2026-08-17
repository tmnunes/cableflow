import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { SortDirection } from '@/types'
import { cn } from '@/utils/cn'

export function SortableTh<T extends string>({
  field,
  label,
  active,
  direction,
  onToggle,
  className,
}: {
  field: T
  label: string
  active: T
  direction: SortDirection
  onToggle: (field: T) => void
  className?: string
}) {
  const isActive = active === field
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <th className={cn('px-3 py-2 font-medium', className)}>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  )
}
