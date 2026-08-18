import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { Material } from '@/types/material'
import type { Supplier } from '@/types/supplier'
import { formatCurrency } from '@/utils/money'
import { cn } from '@/utils/cn'

interface MaterialComboboxProps {
  materials: Material[]
  suppliers: Supplier[]
  selectedId?: string
  locale: string
  placeholder: string
  onSelect: (material: Material) => void
}

export function MaterialCombobox({
  materials,
  suppliers,
  selectedId,
  locale,
  placeholder,
  onSelect,
}: MaterialComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  )

  const selected = materials.find((m) => m.id === selectedId)
  const selectedSupplier = selected?.supplierId
    ? supplierMap.get(selected.supplierId)
    : undefined

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return materials
      .filter((m) => m.active)
      .filter((m) => {
        if (!q) return true
        const supplier = m.supplierId ? supplierMap.get(m.supplierId)?.name : ''
        return [m.name, m.code, m.brand, m.category, supplier]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 80)
  }, [materials, query, supplierMap])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className={cn(
          'flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-2.5 text-left text-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring',
        )}
        onClick={() => {
          setOpen((v) => !v)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <>
              <span className="font-medium">{selected.name}</span>
              {selectedSupplier ? (
                <span className="text-muted-foreground"> · {selectedSupplier.name}</span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[min(28rem,calc(100vw-2rem))] rounded-md border border-border bg-popover shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="h-8 pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {t('projectMaterials.catalogEmpty')}
              </p>
            ) : (
              filtered.map((material) => {
                const supplier = material.supplierId
                  ? supplierMap.get(material.supplierId)
                  : undefined
                const isSelected = material.id === selectedId
                return (
                  <button
                    key={material.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50',
                      isSelected && 'bg-muted/70',
                    )}
                    onClick={() => {
                      onSelect(material)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{material.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(`materials.categories.${material.category}`)}
                        {material.brand ? ` · ${material.brand}` : ''}
                        {supplier ? ` · ${supplier.name}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(material.purchasePrice, locale)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
