import { useMemo, useRef, useState, useEffect } from 'react'
import { Copy, Download, Plus, Search, Trash2, Upload } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createEmptyMaterial, useAppData } from '@/hooks/useAppData'
import type { Material, MaterialCategory, SortDirection } from '@/types'
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '@/types'
import {
  parseMaterialsImport,
  toMaterialsExport,
} from '@/services/importExport'
import { mergeMaterialsImport } from '@/services/storage/migration'
import { createId, downloadJson } from '@/utils/cn'
import { formatCurrency, parseMoneyInput } from '@/utils/money'
import { cn } from '@/utils/cn'

type MaterialSortField = 'name' | 'category' | 'purchasePrice' | 'salePrice'

export function MaterialsPage() {
  const { t } = useTranslation()
  const { materials, suppliers, upsertMaterial, deleteMaterial, setMaterials, locale } =
    useAppData()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | 'all'>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<MaterialSortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showInactive, setShowInactive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const supplier = searchParams.get('supplier')
    if (supplier) setSupplierFilter(supplier)
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = materials.filter((m) => (showInactive ? true : m.active))

    if (categoryFilter !== 'all') {
      list = list.filter((m) => m.category === categoryFilter)
    }
    if (supplierFilter !== 'all') {
      list = list.filter((m) => m.supplierId === supplierFilter)
    }
    if (q) {
      list = list.filter((m) =>
        [m.name, m.code, m.brand, m.model, m.description, m.notes]
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
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [materials, search, categoryFilter, supplierFilter, sortField, sortDirection, showInactive])

  const toggleSort = (field: MaterialSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection('asc')
      return field
    })
  }

  const saveMaterial = (material: Material) => {
    if (!material.name.trim()) {
      toast.error(t('materials.nameRequired'))
      return
    }
    upsertMaterial({ ...material, updatedAt: new Date().toISOString() })
  }

  const handleAdd = () => {
    const material = createEmptyMaterial({ name: t('materials.newMaterial') })
    upsertMaterial(material)
  }

  const handleDuplicate = (source: Material) => {
    const copy: Material = {
      ...source,
      id: createId(),
      name: `${source.name}${t('toast.copySuffix')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    upsertMaterial(copy)
    toast.success(t('toast.duplicated'))
  }

  const handleDeactivate = (material: Material) => {
    upsertMaterial({ ...material, active: false, updatedAt: new Date().toISOString() })
    toast.success(t('materials.deactivated'))
  }

  const handleExport = () => {
    downloadJson('cableflow-materials.json', toMaterialsExport(materials))
    toast.success(t('materials.exported'))
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseMaterialsImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    const merged = mergeMaterialsImport(materials, result.data)
    setMaterials(merged)
    toast.success(t('materials.imported'))
  }

  const supplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('materials.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('materials.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            {t('header.import')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download />
            {t('header.export')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus />
            {t('materials.add')}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void handleImport(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-3 space-y-0">
          <CardTitle className="text-base">{t('materials.catalog')}</CardTitle>
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('materials.search')}
                className="pl-8"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as MaterialCategory | 'all')}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t('materials.filterCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('materials.allCategories')}</SelectItem>
                {MATERIAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`materials.categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t('materials.filterSupplier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('materials.allSuppliers')}</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? t('materials.hideInactive') : t('materials.showInactive')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortableTh field="name" label={t('materials.name')} active={sortField} direction={sortDirection} onToggle={toggleSort} />
                  <th className="px-3 py-2 font-medium">{t('materials.code')}</th>
                  <SortableTh field="category" label={t('materials.category')} active={sortField} direction={sortDirection} onToggle={toggleSort} className="w-36" />
                  <th className="px-3 py-2 font-medium w-28">{t('materials.unit')}</th>
                  <SortableTh field="purchasePrice" label={t('materials.purchasePrice')} active={sortField} direction={sortDirection} onToggle={toggleSort} className="w-32" />
                  <SortableTh field="salePrice" label={t('materials.salePrice')} active={sortField} direction={sortDirection} onToggle={toggleSort} className="w-32" />
                  <th className="px-3 py-2 font-medium w-36">{t('materials.supplier')}</th>
                  <th className="px-3 py-2 font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      {t('materials.empty')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((material) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      locale={locale}
                      supplierName={supplierName(material.supplierId)}
                      suppliers={suppliers}
                      onSave={saveMaterial}
                      onDuplicate={() => handleDuplicate(material)}
                      onDeactivate={() => handleDeactivate(material)}
                      onDelete={() => {
                        if (window.confirm(t('materials.deleteConfirm'))) {
                          deleteMaterial(material.id)
                          toast.success(t('toast.deleted'))
                        }
                      }}
                      t={t}
                    />
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

function MaterialRow({
  material,
  locale,
  supplierName,
  suppliers,
  onSave,
  onDuplicate,
  onDeactivate,
  onDelete,
  t,
}: {
  material: Material
  locale: string
  supplierName: string
  suppliers: ReturnType<typeof useAppData>['suppliers']
  onSave: (m: Material) => void
  onDuplicate: () => void
  onDeactivate: () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  const patch = (p: Partial<Material>) => onSave({ ...material, ...p })

  return (
    <tr
      className={cn(
        'border-b border-border/70 align-top hover:bg-muted/20',
        !material.active && 'opacity-60',
      )}
    >
      <td className="px-3 py-2">
        <Input
          value={material.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={material.code ?? ''}
          onChange={(e) => patch({ code: e.target.value })}
          className="font-mono text-xs"
        />
      </td>
      <td className="px-3 py-2">
        <Select
          value={material.category}
          onValueChange={(v) => patch({ category: v as MaterialCategory })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`materials.categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <Select
          value={material.unit}
          onValueChange={(v) => patch({ unit: v as Material['unit'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_UNITS.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {t(`materials.units.${unit}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <Input
          defaultValue={String(material.purchasePrice)}
          onBlur={(e) => {
            const value = parseMoneyInput(e.target.value)
            if (value !== null) patch({ purchasePrice: value })
          }}
          className="font-mono"
        />
        <span className="mt-0.5 block text-[10px] text-muted-foreground">
          {formatCurrency(material.purchasePrice, locale)}
        </span>
      </td>
      <td className="px-3 py-2">
        <Input
          defaultValue={material.salePrice !== undefined ? String(material.salePrice) : ''}
          onBlur={(e) => {
            const value = parseMoneyInput(e.target.value)
            patch({ salePrice: value ?? undefined })
          }}
          className="font-mono"
        />
        {material.salePrice !== undefined ? (
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {formatCurrency(material.salePrice, locale)}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <Select
          value={material.supplierId ?? 'none'}
          onValueChange={(v) => patch({ supplierId: v === 'none' ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue>{supplierName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {suppliers.filter((s) => s.active).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('table.duplicate')}</TooltipContent>
          </Tooltip>
          {material.active ? (
            <Button variant="ghost" size="sm" onClick={onDeactivate}>
              {t('materials.deactivate')}
            </Button>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('table.delete')}</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  )
}

function getSortValue(m: Material, field: MaterialSortField): string | number {
  switch (field) {
    case 'name':
      return m.name
    case 'category':
      return m.category
    case 'purchasePrice':
      return m.purchasePrice
    case 'salePrice':
      return m.salePrice ?? 0
  }
}
