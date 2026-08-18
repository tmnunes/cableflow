import { useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppData } from '@/hooks/useAppData'
import { formatCurrency } from '@/utils/money'

export function QuotesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { quotes, createQuote, deleteQuote, projects, locale } = useAppData()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...quotes]
      .filter((quote) =>
        q
          ? [quote.number, quote.client.name, quote.status]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [quotes, search])

  const projectName = (id?: string) =>
    projects.find((p) => p.id === id)?.projectName ?? '—'

  const handleNew = () => {
    const quote = createQuote()
    navigate(`/quotes/${quote.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('quotes.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('quotes.subtitle')}</p>
        </div>
        <Button onClick={handleNew}>
          <Plus />
          {t('quotes.new')}
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('quotes.list')}</CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('quotes.search')}
            className="w-full sm:w-64"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('quotes.empty')}</p>
          ) : (
            filtered.map((quote) => {
              const total =
                quote.items.reduce((s, i) => s + i.saleTotal, 0) +
                quote.labor.reduce((s, l) => s + l.totalSale, 0)
              return (
                <div
                  key={quote.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link to={`/quotes/${quote.id}`} className="font-medium hover:text-primary">
                      {quote.number}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {quote.client.name || t('quotes.noClient')} ·{' '}
                      {t(`quotes.status.${quote.status}`)}
                    </p>
                    {quote.projectId ? (
                      <p className="text-xs text-muted-foreground">
                        {t('quotes.linkedProject')}: {projectName(quote.projectId)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(total, locale)}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/quotes/${quote.id}`}>
                        <FileText className="h-3.5 w-3.5" />
                        {t('quotes.open')}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (window.confirm(t('quotes.deleteConfirm'))) {
                          deleteQuote(quote.id)
                          toast.success(t('toast.deleted'))
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
