import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTransferRow } from '@/components/common/DataTransferRow'
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppData } from '@/hooks/useAppData'
import {
  parseMaterialsImport,
  parseSettingsImport,
  parseSuppliersImport,
  toMaterialsExport,
  toSettingsExport,
  toSuppliersExport,
} from '@/services/importExport'
import { mergeMaterialsImport, mergeSuppliersImport } from '@/services/storage/migration'
import { downloadJson } from '@/utils/cn'

export function SettingsPage() {
  const { t } = useTranslation()
  const {
    materials,
    suppliers,
    setMaterials,
    setSuppliers,
    companySettings,
    updateCompanySettings,
    importCompanySettings,
    data,
  } = useAppData()

  const handleSettingsExport = () => {
    downloadJson(
      'cableflow-settings.json',
      toSettingsExport(companySettings, data.quoteNumberState),
    )
    toast.success(t('settings.settingsExported'))
  }

  const handleSettingsImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseSettingsImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    if (!window.confirm(t('settings.settingsImportConfirm'))) return
    importCompanySettings(result.data.companySettings, result.data.quoteNumberState)
    toast.success(t('settings.settingsImported'))
  }

  const handleMaterialsExport = () => {
    downloadJson('cableflow-materials.json', toMaterialsExport(materials))
    toast.success(t('materials.exported'))
  }

  const handleMaterialsImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseMaterialsImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    setMaterials(mergeMaterialsImport(materials, result.data))
    toast.success(t('materials.imported'))
  }

  const handleSuppliersExport = () => {
    downloadJson('cableflow-suppliers.json', toSuppliersExport(suppliers))
    toast.success(t('suppliers.exported'))
  }

  const handleSuppliersImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseSuppliersImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    setSuppliers(mergeSuppliersImport(suppliers, result.data))
    toast.success(t('suppliers.imported'))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <CompanySettingsForm settings={companySettings} onChange={updateCompanySettings} />

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.dataTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('settings.dataDescription')}</p>
          <div className="divide-y divide-border">
            <DataTransferRow
              title={t('settings.companyData')}
              description={t('settings.companyDataHint')}
              onExport={handleSettingsExport}
              onImport={handleSettingsImport}
            />
            <DataTransferRow
              title={t('settings.materialsData')}
              description={t('settings.materialsDataHint')}
              onExport={handleMaterialsExport}
              onImport={handleMaterialsImport}
            />
            <DataTransferRow
              title={t('settings.suppliersData')}
              description={t('settings.suppliersDataHint')}
              onExport={handleSuppliersExport}
              onImport={handleSuppliersImport}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
