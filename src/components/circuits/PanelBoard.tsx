import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppData } from '@/hooks/useAppData'
import { buildPanelRows, protectionLabel, summarizeProtections } from '@/utils/electrical/panel'

interface PanelBoardProps {
  projectId: string
}

function statusClass(status: string): string {
  if (status === 'ok') return 'text-emerald-600'
  if (status === 'error') return 'text-destructive'
  return 'text-amber-600'
}

export function PanelBoard({ projectId }: PanelBoardProps) {
  const { t } = useTranslation()
  const { circuits, materials, locale } = useAppData()
  const projectCircuits = circuits.filter((circuit) => circuit.projectId === projectId)
  const rows = buildPanelRows(projectCircuits)
  const protections = summarizeProtections(projectCircuits)
  const format = (value: number) =>
    new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 2 }).format(value)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('electricalPanel.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('electricalPanel.subtitle')}</p>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('electricalPanel.title')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('electricalPanel.empty')}</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2">{t('electricalPanel.circuit')}</th>
                  <th className="px-4 py-2">{t('electricalPanel.power')}</th>
                  <th className="px-4 py-2">{t('electricalPanel.section')}</th>
                  <th className="px-4 py-2">{t('electricalPanel.protection')}</th>
                  <th className="px-4 py-2">{t('electrical.status.ok')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.circuitId} className="border-b border-border/70">
                    <td className="px-4 py-2">
                      <p className="font-medium">{row.name || t('projects.unnamed')}</p>
                      <p className="text-xs text-muted-foreground">{t(`electrical.categories.${row.category}`)}</p>
                    </td>
                    <td className="px-4 py-2 font-mono">{format(row.designPower)} W</td>
                    <td className="px-4 py-2 font-mono">
                      {row.sectionMm2 ? `${format(row.sectionMm2)} mm²` : '—'}
                    </td>
                    <td className="px-4 py-2">{row.protectionLabel ?? '—'}</td>
                    <td className={`px-4 py-2 ${statusClass(row.validation)}`}>
                      {t(`electrical.status.${row.validation}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('electricalPanel.protections')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {protections.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('electricalPanel.empty')}</p>
          ) : (
            protections.map((item) => {
              const material = materials.find((m) => m.id === item.materialId)
              return (
                <div key={item.key} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{protectionLabel(item)}</p>
                    {material ? (
                      <p className="text-xs text-muted-foreground">{material.name}</p>
                    ) : null}
                  </div>
                  <Badge variant="secondary">× {item.count}</Badge>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
