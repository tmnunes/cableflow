import { useMemo, useState } from 'react'
import { Copy, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SortableTh } from '@/components/common/SortableTh'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createEmptyLoadType, useAppData } from '@/hooks/useAppData'
import { CIRCUIT_CATEGORIES, type CircuitCategory, type LoadType, type SortDirection } from '@/types'
import { createId } from '@/utils/cn'
import { cn } from '@/utils/cn'

type LoadSortField = 'name' | 'category' | 'defaultUnitPower'

export function LoadTypesPage() {
  const { t } = useTranslation()
  const { loadTypes, upsertLoadType, deleteLoadType } = useAppData()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CircuitCategory | 'all'>('all')
  const [sortField, setSortField] = useState<LoadSortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = loadTypes.filter((item) => (showInactive ? true : item.active))
    if (categoryFilter !== 'all') list = list.filter((item) => item.category === categoryFilter)
    if (q) {
      list = list.filter((item) =>
        [item.name, item.category, item.notes].filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    }
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = sortField === 'name' ? a.name : sortField === 'category' ? a.category : a.defaultUnitPower
      const bv = sortField === 'name' ? b.name : sortField === 'category' ? b.category : b.defaultUnitPower
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [loadTypes, search, categoryFilter, sortField, sortDirection, showInactive])

  const toggleSort = (field: LoadSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection('asc')
      return field
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('loadTypes.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('loadTypes.subtitle')}</p>
        </div>
        <Button onClick={() => upsertLoadType(createEmptyLoadType())}>
          <Plus />
          {t('loadTypes.add')}
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-3 space-y-0">
          <CardTitle className="text-base">{t('loadTypes.catalog')}</CardTitle>
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('loadTypes.search')} className="pl-8" />
            </div>
            <Select value={String(categoryFilter)} onValueChange={(v) => setCategoryFilter(v as CircuitCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('materials.allCategories')}</SelectItem>
                {CIRCUIT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(`electrical.categories.${category}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={showInactive ? 'secondary' : 'outline'} size="sm" onClick={() => setShowInactive((v) => !v)}>
              {showInactive ? t('materials.hideInactive') : t('materials.showInactive')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-2">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <SortableTh field="name" label={t('loadTypes.name')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                <SortableTh field="category" label={t('loadTypes.category')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                <SortableTh field="defaultUnitPower" label={t('loadTypes.power')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                <th className="px-3 py-2">{t('loadTypes.powerFactor')}</th>
                <th className="px-3 py-2">{t('loadTypes.utilization')}</th>
                <th className="px-3 py-2">{t('loadTypes.simultaneity')}</th>
                <th className="px-3 py-2">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">{t('loadTypes.empty')}</td>
                </tr>
              ) : (
                filtered.map((loadType) => (
                  <tr key={loadType.id} className={cn('border-b border-border/70 align-top', !loadType.active && 'opacity-60')}>
                    <td className="px-3 py-2">
                      <Input
                        value={loadType.name}
                        onChange={(e) => upsertLoadType({ ...loadType, name: e.target.value, updatedAt: new Date().toISOString() })}
                      />
                      {loadType.isExample ? <Badge variant="outline" className="mt-1">{t('loadTypes.example')}</Badge> : null}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={loadType.category}
                        onValueChange={(value) =>
                          upsertLoadType({ ...loadType, category: value as CircuitCategory, updatedAt: new Date().toISOString() })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CIRCUIT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {t(`electrical.categories.${category}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={loadType.defaultUnitPower}
                        onChange={(e) =>
                          upsertLoadType({
                            ...loadType,
                            defaultUnitPower: Number(e.target.value) || 0,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step="0.01"
                        value={loadType.defaultPowerFactor ?? ''}
                        onChange={(e) =>
                          upsertLoadType({
                            ...loadType,
                            defaultPowerFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step="0.01"
                        value={loadType.defaultUtilizationFactor ?? ''}
                        onChange={(e) =>
                          upsertLoadType({
                            ...loadType,
                            defaultUtilizationFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step="0.01"
                        value={loadType.defaultSimultaneityFactor ?? ''}
                        onChange={(e) =>
                          upsertLoadType({
                            ...loadType,
                            defaultSimultaneityFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const copy: LoadType = {
                              ...loadType,
                              id: createId(),
                              name: `${loadType.name}${t('toast.copySuffix')}`,
                              isExample: false,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }
                            upsertLoadType(copy)
                            toast.success(t('toast.duplicated'))
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (window.confirm(t('loadTypes.deleteConfirm'))) deleteLoadType(loadType.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
