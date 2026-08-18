import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface DataTransferRowProps {
  title: string
  description?: string
  onExport: () => void
  onImport: (file: File | null) => void | Promise<void>
}

export function DataTransferRow({
  title,
  description,
  onExport,
  onImport,
}: DataTransferRowProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload />
          {t('header.import')}
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download />
          {t('header.export')}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void onImport(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />
    </div>
  )
}
