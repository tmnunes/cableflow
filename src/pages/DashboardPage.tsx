import { Link } from 'react-router-dom'
import { FileText, FolderKanban, Package, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { useAppData } from '@/hooks/useAppData'
import { formatCurrency } from '@/utils/money'

export function DashboardPage() {
  const { t } = useTranslation()
  const { projects, materials, suppliers, data, locale } = useAppData()

  const draftQuotes = data.quotes.filter((q) => q.status === 'draft').length
  const sentQuotes = data.quotes.filter((q) => q.status === 'sent').length
  const quotesTotal = data.quotes.reduce(
    (sum, q) => sum + q.items.reduce((s, i) => s + i.saleTotal, 0),
    0,
  )

  const cards = [
    {
      label: t('dashboard.projects'),
      value: String(projects.length),
      icon: FolderKanban,
      to: '/projects',
    },
    {
      label: t('dashboard.materials'),
      value: String(materials.filter((m) => m.active).length),
      icon: Package,
      to: '/materials',
    },
    {
      label: t('dashboard.suppliers'),
      value: String(suppliers.filter((s) => s.active).length),
      icon: Truck,
      to: '/suppliers',
    },
    {
      label: t('dashboard.quotes'),
      value: String(data.quotes.length),
      icon: FileText,
      to: '/quotes',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="border-border/70 transition-colors hover:border-primary/40">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <card.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t('dashboard.draftQuotes')}
            </p>
            <p className="mt-1 text-xl font-semibold">{draftQuotes}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t('dashboard.sentQuotes')}
            </p>
            <p className="mt-1 text-xl font-semibold">{sentQuotes}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t('dashboard.quotesValue')}
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(quotesTotal, locale)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
