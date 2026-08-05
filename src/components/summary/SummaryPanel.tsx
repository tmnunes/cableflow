import { useTranslation } from 'react-i18next'
import { ConductorSwatch } from '@/components/project/ConductorSwatch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <Card className="flex h-full min-h-[320px] flex-col border-border/70 lg:sticky lg:top-[7.5rem] print:static print:min-h-0 print:break-before-page">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('summary.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('summary.bySection')}</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-0 pb-0 print:overflow-visible">
        {summary.bySection.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{t('summary.empty')}</p>
        ) : (
          <ScrollArea className="h-[min(70vh,640px)] px-4 pb-4 print:h-auto">
            <div className="space-y-5">
              {summary.bySection.map((section) => (
                <div key={section.sectionMm2} className="space-y-2 print:break-inside-avoid">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {t('summary.sectionLabel', { section: section.sectionMm2 })}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatMeters(section.totalMeters, locale)} {t('summary.meters')}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {section.conductors.map((c) => {
                      const def = CONDUCTOR_MAP[c.code]
                      return (
                        <li
                          key={`${section.sectionMm2}-${c.code}`}
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <ConductorSwatch code={c.code} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {t(`conductors.colors.${def.color}`)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t(`conductors.${c.code}`)}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
