import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTransferRow } from '@/components/common/DataTransferRow'
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppData } from '@/hooks/useAppData'
import {
  parseSettingsMaterialsSuppliersImport,
  toSettingsMaterialsSuppliersTransfer,
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

  const handleSettingsMaterialsSuppliersExport = () => {
    downloadJson(
      'cableflow-settings-materials-suppliers.json',
      toSettingsMaterialsSuppliersTransfer(
        companySettings,
        data.quoteNumberState,
        materials,
        suppliers,
      ),
    )
    toast.success(t('settings.settingsMaterialsSuppliersExported'))
  }

  const handleSettingsMaterialsSuppliersImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseSettingsMaterialsSuppliersImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    if (!window.confirm(t('settings.settingsMaterialsSuppliersImportConfirm'))) return
    setMaterials(mergeMaterialsImport(materials, result.data.materials))
    setSuppliers(mergeSuppliersImport(suppliers, result.data.suppliers))
    importCompanySettings(result.data.companySettings, result.data.quoteNumberState)
    toast.success(t('settings.settingsMaterialsSuppliersImported'))
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
              title={t('settings.settingsMaterialsSuppliersData')}
              description={t('settings.settingsMaterialsSuppliersDataHint')}
              onExport={handleSettingsMaterialsSuppliersExport}
              onImport={handleSettingsMaterialsSuppliersImport}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
