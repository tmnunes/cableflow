import { useMemo, useRef, useState } from 'react'
import { Download, FileUp, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Material, Supplier } from '@/types'
import {
  applyMaterialsCsvImport,
  downloadMaterialsCsvTemplate,
  parseMaterialsCsv,
  type MaterialsCsvParseResult,
} from '@/utils/materials/csvImport'
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '@/types'

interface MaterialsCsvImportCardProps {
  materials: Material[]
  suppliers: Supplier[]
  onApply: (next: Material[]) => void
}

export function MaterialsCsvImportCard({
  materials,
  suppliers,
  onApply,
}: MaterialsCsvImportCardProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [supplierId, setSupplierId] = useState('')
  const [preview, setPreview] = useState<MaterialsCsvParseResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.active),
    [suppliers],
  )

  const resetFile = () => {
    setPreview(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    if (!supplierId) {
      toast.error(t('materials.csv.supplierRequired'))
      resetFile()
      return
    }

    const text = await file.text()
    const result = parseMaterialsCsv(text, materials, supplierId)
    setFileName(file.name)
    setPreview(result)

    if (result.rows.length === 0) {
      toast.error(t('materials.csv.emptyFile'))
    }
  }

  const handleConfirm = () => {
    if (!preview || !supplierId) return
    if (preview.validCount === 0) {
      toast.error(t('materials.csv.nothingToImport'))
      return
    }

    const next = applyMaterialsCsvImport(materials, preview.rows, supplierId)
    onApply(next)
    toast.success(
      t('materials.csv.imported', {
        created: preview.createCount,
        updated: preview.updateCount,
        skipped: preview.errorCount,
      }),
    )
    resetFile()
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('materials.csv.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('materials.csv.description')}</p>

        <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
          <p className="font-medium">{t('materials.csv.formatTitle')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t('materials.csv.formatDelimiter')}</li>
            <li>{t('materials.csv.formatColumns')}</li>
            <li>{t('materials.csv.formatUnits')}</li>
            <li>{t('materials.csv.formatCategories')}</li>
            <li>{t('materials.csv.formatSupplier')}</li>
            <li>{t('materials.csv.formatMerge')}</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('materials.csv.allowedUnits', {
              units: MATERIAL_UNITS.join(', '),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('materials.csv.allowedCategories', {
              categories: MATERIAL_CATEGORIES.join(', '),
            })}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t('materials.csv.supplierLabel')}
            </label>
            <Select
              value={supplierId || undefined}
              onValueChange={(value) => {
                setSupplierId(value)
                resetFile()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('materials.csv.supplierPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {activeSuppliers.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    {t('materials.csv.noSuppliers')}
                  </SelectItem>
                ) : (
                  activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => downloadMaterialsCsvTemplate()}
          >
            <Download className="h-4 w-4" />
            {t('materials.csv.downloadTemplate')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={!supplierId}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {t('materials.csv.chooseFile')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {preview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">
                {t('materials.csv.previewSummary', {
                  create: preview.createCount,
                  update: preview.updateCount,
                  error: preview.errorCount,
                  delimiter: preview.delimiter,
                })}
              </span>
            </div>

            <div className="max-h-72 overflow-auto rounded-lg border border-border/70">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">{t('materials.csv.colLine')}</th>
                    <th className="px-2 py-2">{t('materials.csv.colStatus')}</th>
                    <th className="px-2 py-2">{t('materials.code')}</th>
                    <th className="px-2 py-2">{t('materials.name')}</th>
                    <th className="px-2 py-2">{t('materials.purchasePrice')}</th>
                    <th className="px-2 py-2">{t('materials.unit')}</th>
                    <th className="px-2 py-2">{t('materials.csv.colIssues')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.line} className="border-b border-border/50 align-top">
                      <td className="px-2 py-2 tabular-nums">{row.line}</td>
                      <td className="px-2 py-2">
                        {t(`materials.csv.status.${row.status}`)}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {row.draft.code || '—'}
                      </td>
                      <td className="px-2 py-2">{row.draft.name || '—'}</td>
                      <td className="px-2 py-2 tabular-nums">
                        {row.draft.purchasePrice}
                      </td>
                      <td className="px-2 py-2">{row.draft.unit}</td>
                      <td className="px-2 py-2 text-xs text-destructive">
                        {[...row.errors, ...row.warnings]
                          .map((key) => t(`materials.csv.errors.${key}`))
                          .join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={preview.validCount === 0}
              >
                {t('materials.csv.confirm', { count: preview.validCount })}
              </Button>
              <Button type="button" variant="outline" onClick={resetFile}>
                {t('materials.csv.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
