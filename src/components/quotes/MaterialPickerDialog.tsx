import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Material } from '@/types'

interface MaterialPickerDialogProps {
  materials: Material[]
  open: boolean
  onClose: () => void
  onSelect: (material: Material, quantity: number) => void
}

export function MaterialPickerDialog({
  materials,
  open,
  onClose,
  onSelect,
}: MaterialPickerDialogProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('1')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials
      .filter((m) => m.active)
      .filter((m) =>
        q
          ? [m.name, m.code, m.brand, m.category].filter(Boolean).join(' ').toLowerCase().includes(q)
          : true,
      )
      .slice(0, 50)
  }, [materials, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t('quotes.picker.close')}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">{t('quotes.picker.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('quotes.picker.search')}
              className="pl-8"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('quotes.picker.quantity')}</span>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 font-mono"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto border-t border-border">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {t('quotes.picker.empty')}
            </p>
          ) : (
            filtered.map((material) => (
              <button
                key={material.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-4 py-3 text-left hover:bg-muted/40"
                onClick={() => {
                  onSelect(material, Number(quantity) || 1)
                  onClose()
                  setSearch('')
                  setQuantity('1')
                }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{material.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`materials.categories.${material.category}`)} · {material.purchasePrice} €
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
