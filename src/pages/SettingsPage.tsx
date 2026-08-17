import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppData } from '@/hooks/useAppData'
import type { AppData } from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import { parseBackupImport, toAppDataExport } from '@/services/importExport'
import { mergeAppDataImport } from '@/services/storage/migration'
import { downloadJson } from '@/utils/cn'

export function SettingsPage() {
  const { t } = useTranslation()
  const { data, replaceAppData, companySettings, updateCompanySettings } = useAppData()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleBackupExport = () => {
    downloadJson('cableflow-backup.json', toAppDataExport(data))
    toast.success(t('settings.backupExported'))
  }

  const handleBackupImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseBackupImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    if (!window.confirm(t('settings.backupImportConfirm'))) return
    const incoming: AppData = {
      version: DATA_VERSION,
      projects: result.data.projects,
      materials: result.data.materials,
      suppliers: result.data.suppliers,
      quotes: result.data.quotes,
      companySettings: result.data.companySettings,
      quoteNumberState: result.data.quoteNumberState,
      activeProjectId: data.activeProjectId,
    }
    replaceAppData(mergeAppDataImport(data, incoming))
    toast.success(t('settings.backupImported'))
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
          <CardTitle className="text-base">{t('settings.backupTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('settings.backupDescription')}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBackupExport}>
              <Download />
              {t('settings.exportBackup')}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload />
              {t('settings.importBackup')}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void handleBackupImport(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
