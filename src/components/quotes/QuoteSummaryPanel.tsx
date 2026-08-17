import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { QuoteTotals } from '@/utils/quotes'
import { formatCurrency } from '@/utils/money'

interface QuoteSummaryPanelProps {
  totals: QuoteTotals
  locale: string
  showInternal?: boolean
}

export function QuoteSummaryPanel({
  totals,
  locale,
  showInternal = true,
}: QuoteSummaryPanelProps) {
  const { t } = useTranslation()

  return (
    <Card className="h-fit border-border/70 lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('quotes.summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showInternal ? (
          <>
            <Row
              label={t('quotes.summary.materialsCost')}
              value={formatCurrency(totals.materialsPurchase, locale)}
            />
            <Row
              label={t('quotes.summary.laborCost')}
              value={formatCurrency(totals.laborCost, locale)}
            />
            <Separator />
            <Row
              label={t('quotes.summary.totalCost')}
              value={formatCurrency(totals.totalCost, locale)}
              bold
            />
            <Row
              label={t('quotes.summary.materialsSale')}
              value={formatCurrency(totals.materialsSale, locale)}
            />
            <Row
              label={t('quotes.summary.laborSale')}
              value={formatCurrency(totals.laborSale, locale)}
            />
            <Row
              label={t('quotes.summary.subtotal')}
              value={formatCurrency(totals.totalSale, locale)}
            />
            {totals.discount > 0 ? (
              <Row
                label={t('quotes.summary.discount')}
                value={`-${formatCurrency(totals.discount, locale)}`}
              />
            ) : null}
            <Separator />
            <Row
              label={t('quotes.summary.grossProfit')}
              value={formatCurrency(totals.grossProfit, locale)}
            />
            <Row
              label={t('quotes.summary.margin')}
              value={`${totals.marginPercent.toFixed(2)} %`}
            />
            <Row
              label={t('quotes.summary.markup')}
              value={`${totals.markupPercent.toFixed(2)} %`}
            />
            <Separator />
          </>
        ) : null}

        <Row
          label={t('quotes.summary.beforeTax')}
          value={formatCurrency(totals.subtotalAfterDiscount, locale)}
        />
        <Row
          label={t('quotes.summary.tax', { rate: totals.taxRate })}
          value={formatCurrency(totals.taxAmount, locale)}
        />
        <Separator />
        <Row
          label={t('quotes.summary.grandTotal')}
          value={formatCurrency(totals.grandTotal, locale)}
          bold
          large
        />
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  value,
  bold,
  large,
}: {
  label: string
  value: string
  bold?: boolean
  large?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold tabular-nums' : 'tabular-nums'} style={large ? { fontSize: '1.125rem' } : undefined}>
        {value}
      </span>
    </div>
  )
}
