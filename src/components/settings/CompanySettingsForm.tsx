import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CompanySettings } from '@/types/company'

interface CompanySettingsFormProps {
  settings: CompanySettings
  onChange: (patch: Partial<CompanySettings>) => void
}

export function CompanySettingsForm({ settings, onChange }: CompanySettingsFormProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{t('settings.companyTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label={t('settings.company.name')}>
          <Input
            value={settings.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.taxNumber')}>
          <Input
            value={settings.taxNumber ?? ''}
            onChange={(e) => onChange({ taxNumber: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.email')}>
          <Input
            type="email"
            value={settings.email ?? ''}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.phone')}>
          <Input
            value={settings.phone ?? ''}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.website')}>
          <Input
            value={settings.website ?? ''}
            onChange={(e) => onChange({ website: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.quotePrefix')}>
          <Input
            value={settings.quotePrefix}
            onChange={(e) => onChange({ quotePrefix: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label={t('settings.company.address')} className="sm:col-span-2">
          <Input
            value={settings.address ?? ''}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </Field>
        <Field label={t('settings.company.defaultTaxRate')}>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={settings.defaultTaxRate}
            onChange={(e) => onChange({ defaultTaxRate: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label={t('settings.company.defaultMargin')}>
          <Input
            type="number"
            min={0}
            max={99}
            step="0.1"
            value={settings.defaultMargin}
            onChange={(e) => onChange({ defaultMargin: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label={t('settings.company.logo')} className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    onChange({ logo: reader.result })
                  }
                }
                reader.readAsDataURL(file)
              }}
            />
            {settings.logo ? (
              <Button variant="outline" size="sm" onClick={() => onChange({ logo: undefined })}>
                {t('settings.company.removeLogo')}
              </Button>
            ) : null}
          </div>
          {settings.logo ? (
            <img src={settings.logo} alt="" className="mt-2 h-16 object-contain" />
          ) : null}
        </Field>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
