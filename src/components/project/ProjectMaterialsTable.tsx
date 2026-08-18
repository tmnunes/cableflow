import { Copy, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProjectMaterialItem } from '@/types/cable'

const UNITS = ['unit', 'meter', 'roll', 'box', 'set', 'kg', 'other'] as const

interface Props {
  items: ProjectMaterialItem[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<ProjectMaterialItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  locale: string
}

export function ProjectMaterialsTable({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  locale,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

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
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-1">
                    <Input
                      value={item.description}
                      onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                      className="h-8 text-sm"
                      placeholder={t('projectMaterials.description')}
                    />
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
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={item.unit}
                      onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
