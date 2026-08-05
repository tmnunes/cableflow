import { CONDUCTOR_MAP } from '@/data/circuits'
import type { ConductorCode } from '@/types'
import { cn } from '@/utils/cn'

interface ConductorSwatchProps {
  code: ConductorCode
  className?: string
  size?: 'sm' | 'md'
}

export function ConductorSwatch({ code, className, size = 'sm' }: ConductorSwatchProps) {
  const def = CONDUCTOR_MAP[code]
  const dim = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  if (def.hexSecondary) {
    return (
      <span
        className={cn('inline-block shrink-0 rounded-sm border border-black/10', dim, className)}
        style={{
          background: `repeating-linear-gradient(-45deg, ${def.hex}, ${def.hex} 2px, ${def.hexSecondary} 2px, ${def.hexSecondary} 4px)`,
        }}
        aria-hidden
      />
    )
  }

  return (
    <span
      className={cn('inline-block shrink-0 rounded-sm border border-black/10', dim, className)}
      style={{ backgroundColor: def.hex }}
      aria-hidden
    />
  )
}
