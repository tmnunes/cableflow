import { useMemo, useState } from 'react'
import { Copy, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SortableTh } from '@/components/common/SortableTh'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createEmptySupplier, useAppData } from '@/hooks/useAppData'
import type { SortDirection, Supplier } from '@/types'
import { createId } from '@/utils/cn'
import { cn } from '@/utils/cn'

type SupplierSortField = 'name' | 'email' | 'phone'

export function SuppliersPage() {
  const { t } = useTranslation()
  const { suppliers, materials, upsertSupplier, deleteSupplier } = useAppData()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SupplierSortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showInactive, setShowInactive] = useState(false)

  const materialCount = (supplierId: string) =>
    materials.filter((m) => m.supplierId === supplierId).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = suppliers.filter((s) => (showInactive ? true : s.active))
    if (q) {
      list = list.filter((s) =>
        [s.name, s.taxNumber, s.email, s.phone, s.address, s.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = getSortValue(a, sortField)
      const bv = getSortValue(b, sortField)
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [suppliers, search, sortField, sortDirection, showInactive])

  const toggleSort = (field: SupplierSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection('asc')
      return field
    })
  }

  const saveSupplier = (supplier: Supplier) => {
    if (!supplier.name.trim()) {
      toast.error(t('suppliers.nameRequired'))
      return
    }
    upsertSupplier({ ...supplier, updatedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('suppliers.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('suppliers.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => upsertSupplier(createEmptySupplier())}>
            <Plus />
            {t('suppliers.add')}
          </Button>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('suppliers.list')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('suppliers.search')}
                className="pl-8"
              />
            </div>
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? t('suppliers.hideInactive') : t('suppliers.showInactive')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortableTh field="name" label={t('suppliers.name')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                  <th className="px-3 py-2 font-medium">{t('suppliers.taxNumber')}</th>
                  <SortableTh field="email" label={t('suppliers.email')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                  <SortableTh field="phone" label={t('suppliers.phone')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                  <th className="px-3 py-2 font-medium">{t('suppliers.materials')}</th>
                  <th className="px-3 py-2 font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {t('suppliers.empty')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className={cn(
                        'border-b border-border/70 align-top hover:bg-muted/20',
                        !supplier.active && 'opacity-60',
                      )}
                    >
                      <td className="px-3 py-2">
                        <Input
                          value={supplier.name}
                          onChange={(e) =>
                            saveSupplier({ ...supplier, name: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={supplier.taxNumber ?? ''}
                          onChange={(e) =>
                            saveSupplier({ ...supplier, taxNumber: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={supplier.email ?? ''}
                          onChange={(e) =>
                            saveSupplier({ ...supplier, email: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={supplier.phone ?? ''}
                          onChange={(e) =>
                            saveSupplier({ ...supplier, phone: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/materials?supplier=${supplier.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {t('suppliers.materialCount', {
                            count: materialCount(supplier.id),
                          })}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const copy: Supplier = {
                                    ...supplier,
                                    id: createId(),
                                    name: `${supplier.name}${t('toast.copySuffix')}`,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                  }
                                  upsertSupplier(copy)
                                  toast.success(t('toast.duplicated'))
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('table.duplicate')}</TooltipContent>
                          </Tooltip>
                          {supplier.active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                upsertSupplier({
                                  ...supplier,
                                  active: false,
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                            >
                              {t('suppliers.deactivate')}
                            </Button>
                          ) : null}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (window.confirm(t('suppliers.deleteConfirm'))) {
                                    deleteSupplier(supplier.id)
                                    toast.success(t('toast.deleted'))
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('table.delete')}</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getSortValue(s: Supplier, field: SupplierSortField): string {
  switch (field) {
    case 'name':
      return s.name
    case 'email':
      return s.email ?? ''
    case 'phone':
      return s.phone ?? ''
  }
}
