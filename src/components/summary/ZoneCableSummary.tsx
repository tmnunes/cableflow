import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ZoneSummary } from '@/types'
import { formatMeters } from '@/utils/cn'

interface ZoneCableSummaryProps {
  zones: ZoneSummary[]
  locale: string
}

export function ZoneCableSummary({ zones, locale }: ZoneCableSummaryProps) {
  const { t } = useTranslation()

  if (zones.length === 0) return null

  return (
    <Card className="border-border/70 print:border print:shadow-none">
      <CardHeader className="pb-3 print:p-2 print:pb-1">
        <CardTitle className="text-base print:text-sm">{t('summary.byZone')}</CardTitle>
        <p className="text-xs text-muted-foreground print:text-[10px]">
          {t('summary.byZoneHint')}
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">{t('summary.zone')}</th>
                <th className="px-3 py-2 font-medium">{t('summary.circuit')}</th>
                <th className="px-3 py-2 font-medium">{t('summary.section')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('summary.conduitMeters')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('summary.cableMeters')}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => {
                const label = zone.description || t('summary.unnamedZone')
                const rowSpan = zone.byCircuit.length + 1

                return (
                  <Fragment key={zone.description || '__unnamed__'}>
                    {zone.byCircuit.map((circuit, index) => (
                      <tr
                        key={`${zone.description}::${circuit.type}`}
                        className="border-b border-border/60 align-middle hover:bg-muted/20"
                      >
                        {index === 0 ? (
                          <td
                            rowSpan={rowSpan}
                            className="border-r border-border/50 px-3 py-2 align-top font-medium"
                          >
                            <span className="block">{label}</span>
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              {formatMeters(zone.cableMeters, locale)} {t('summary.meters')}{' '}
                              {t('summary.cableShort')}
                              {' · '}
                              {formatMeters(zone.conduitMeters, locale)} {t('summary.meters')}{' '}
                              {t('summary.conduitShort')}
                            </span>
                          </td>
                        ) : null}
                        <td className="px-3 py-2">{t(`circuits.${circuit.type}`)}</td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {circuit.sectionMm2} {t('table.sectionUnit')}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatMeters(circuit.conduitMeters, locale)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                          {formatMeters(circuit.cableMeters, locale)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-border bg-muted/25 text-xs font-medium">
                      <td colSpan={2} className="px-3 py-1.5 text-muted-foreground">
                        {t('summary.zoneTotal')}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                        {formatMeters(zone.conduitMeters, locale)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                        {formatMeters(zone.cableMeters, locale)}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
