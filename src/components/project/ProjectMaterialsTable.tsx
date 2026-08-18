import { Copy, Library, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProjectMaterialItem } from '@/types/cable'
import type { Material } from '@/types/material'
import type { Supplier } from '@/types/supplier'
import { formatCurrency } from '@/utils/money'

const UNITS = ['unit', 'meter', 'roll', 'box', 'set', 'kg', 'other'] as const

interface Props {
  items: ProjectMaterialItem[]
  onAdd: () => void
  onAddFromCatalog: (material: Material, supplier: Supplier | undefined, quantity: number) => void
  onUpdate: (id: string, patch: Partial<ProjectMaterialItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  locale: string
  catalogMaterials: Material[]
  suppliers: Supplier[]
}

export function ProjectMaterialsTable({
  items,
  onAdd,
  onAddFromCatalog,
  onUpdate,
  onDelete,
  onDuplicate,
  locale,
  catalogMaterials,
  suppliers,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (m) =>
        m.description.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q),
    )
  }, [items, search])

  const totalCost = useMemo(
    () => items.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0),
    [items],
  )

  const fmt = (v: number) =>
    v.toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const supplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.name

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projectMaterials.search')}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {t('projectMaterials.totalCost')}: {fmt(totalCost)}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            <Library className="h-4 w-4" />
            {t('projectMaterials.fromCatalog')}
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {t('projectMaterials.add')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2">{t('projectMaterials.description')}</th>
              <th className="px-3 py-2 w-20">{t('projectMaterials.quantity')}</th>
              <th className="px-3 py-2 w-28">{t('projectMaterials.unit')}</th>
              <th className="px-3 py-2 w-28">{t('projectMaterials.unitPrice')}</th>
              <th className="px-3 py-2 w-28">{t('projectMaterials.total')}</th>
              <th className="px-3 py-2">{t('projectMaterials.notes')}</th>
              <th className="px-3 py-2 w-20">{t('projectMaterials.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  {items.length === 0
                    ? t('projectMaterials.empty')
                    : t('table.emptySearch')}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isCableAuto = !!item.cableSourceKey
                const supplier = supplierName(item.supplierId)
                return (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1">
                      <div>
                        <Input
                          value={item.description}
                          onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                          className="h-8 text-sm"
                          placeholder={t('projectMaterials.description')}
                          readOnly={isCableAuto}
                        />
                        {(supplier || isCableAuto) && (
                          <div className="mt-0.5 flex gap-1.5 text-[10px] text-muted-foreground">
                            {supplier && <span>{supplier}</span>}
                            {isCableAuto && (
                              <span className="rounded bg-primary/10 px-1 text-primary">auto</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          onUpdate(item.id, {
                            quantity: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="h-8 w-full text-sm"
                        min={0}
                        step="any"
                        readOnly={isCableAuto}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={item.unit}
                        onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        disabled={isCableAuto}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {t(`projectMaterials.units.${u}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          onUpdate(item.id, {
                            unitPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="h-8 w-full text-sm"
                        min={0}
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-medium tabular-nums">
                      {fmt(item.quantity * item.unitPrice)}
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        value={item.notes}
                        onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
                        className="h-8 text-sm"
                        placeholder={t('projectMaterials.notes')}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-0.5">
                        {!isCableAuto && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => onDuplicate(item.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDelete(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pickerOpen && (
        <CatalogPickerDialog
          materials={catalogMaterials}
          suppliers={suppliers}
          locale={locale}
          onSelect={(material, supplier, qty) => {
            onAddFromCatalog(material, supplier, qty)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

function CatalogPickerDialog({
  materials,
  suppliers,
  locale,
  onSelect,
  onClose,
}: {
  materials: Material[]
  suppliers: Supplier[]
  locale: string
  onSelect: (material: Material, supplier: Supplier | undefined, quantity: number) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('1')

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials
      .filter((m) => m.active)
      .filter((m) => {
        if (!q) return true
        const supplier = m.supplierId ? supplierMap.get(m.supplierId) : undefined
        return [m.name, m.code, m.brand, m.category, supplier?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 50)
  }, [materials, search, supplierMap])

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
          <h2 className="font-semibold">{t('projectMaterials.fromCatalog')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('quotes.picker.close')}
          </Button>
        </div>
        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('projectMaterials.search')}
              className="pl-8"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('projectMaterials.quantity')}</span>
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
              {t('projectMaterials.catalogEmpty')}
            </p>
          ) : (
            filtered.map((material) => {
              const supplier = material.supplierId
                ? supplierMap.get(material.supplierId)
                : undefined
              return (
                <button
                  key={material.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-4 py-3 text-left hover:bg-muted/40"
                  onClick={() => {
                    onSelect(material, supplier, Number(quantity) || 1)
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{material.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`materials.categories.${material.category}`)}
                      {material.brand && <> · {material.brand}</>}
                      {supplier && (
                        <> · <span className="font-medium">{supplier.name}</span></>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(material.purchasePrice, locale)}
                    </p>
                    {material.unit && (
                      <p className="text-[10px] text-muted-foreground">
                        /{t(`materials.units.${material.unit}`)}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
