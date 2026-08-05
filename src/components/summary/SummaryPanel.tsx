import { useTranslation } from 'react-i18next'
import { ConductorSwatch } from '@/components/project/ConductorSwatch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CONDUCTOR_MAP } from '@/data/circuits'
import type { ProjectSummary } from '@/types'
import { formatMeters } from '@/utils/cn'

interface SummaryPanelProps {
  summary: ProjectSummary
  locale: string
}

export function SummaryPanel({ summary, locale }: SummaryPanelProps) {
  const { t } = useTranslation()

  return (
    <Card className="h-fit border-border/70 lg:sticky lg:top-[7.5rem] print:static">
      <CardHeader className="pb-3 print:p-2 print:pb-1">
        <CardTitle className="text-base print:text-sm">{t('summary.title')}</CardTitle>
        <p className="text-xs text-muted-foreground print:text-[10px]">{t('summary.bySection')}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 print:p-2">
        {summary.bySection.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('summary.empty')}</p>
        ) : (
          <div className="space-y-5 print:space-y-2">
            {summary.bySection.map((section) => (
              <div key={section.sectionMm2} className="space-y-2 print:space-y-1 print:break-inside-avoid">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs print:text-[9px] print:px-1 print:py-0">
                    {t('summary.sectionLabel', { section: section.sectionMm2 })}
                  </Badge>
                  <span className="text-xs text-muted-foreground print:text-[9px]">
                    {formatMeters(section.totalMeters, locale)} {t('summary.meters')}
                  </span>
                </div>
                <ul className="space-y-1.5 print:space-y-0.5">
                  {section.conductors.map((c) => {
                    const def = CONDUCTOR_MAP[c.code]
                    return (
                      <li
                        key={`${section.sectionMm2}-${c.code}`}
                        className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-2 print:px-1.5 print:py-0.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <ConductorSwatch code={c.code} size="md" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium print:text-[10px]">
                              {t(`conductors.colors.${def.color}`)}
                            </p>
                            <p className="text-xs text-muted-foreground print:text-[8px]">
                              {t(`conductors.${c.code}`)}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-mono text-sm font-semibold tabular-nums print:text-[10px]">
                          {formatMeters(c.meters, locale)} {t('summary.meters')}
                        </p>
                      </li>
                    )
                  })}
                </ul>
                <Separator className="opacity-60" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
