import { Cable, Layers, Route, Waypoints } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import type { ProjectTotals } from '@/types'
import { formatMeters } from '@/utils/cn'

interface StatsCardsProps {
  totals: ProjectTotals
  locale: string
}

export function StatsCards({ totals, locale }: StatsCardsProps) {
  const { t } = useTranslation()

  const cards = [
    {
      label: t('stats.conduitLength'),
      value: `${formatMeters(totals.totalConduitLength, locale)} ${t('stats.meters')}`,
      icon: Route,
    },
    {
      label: t('stats.cableLength'),
      value: `${formatMeters(totals.totalCableLength, locale)} ${t('stats.meters')}`,
      icon: Cable,
    },
    {
      label: t('stats.cableRuns'),
      value: String(totals.cableRuns),
      icon: Layers,
    },
    {
      label: t('stats.conductors'),
      value: String(totals.totalConductors),
      icon: Waypoints,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="overflow-hidden border-border/70 bg-gradient-to-br from-card to-muted/30"
        >
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <card.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <p className="mt-1 truncate text-xl font-semibold tracking-tight">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
