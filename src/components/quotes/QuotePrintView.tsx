import { useTranslation } from 'react-i18next'
import type { CompanySettings } from '@/types/company'
import type { Quote } from '@/types/quote'
import type { QuoteTotals } from '@/utils/quotes'
import { formatCurrency } from '@/utils/money'

interface QuotePrintViewProps {
  quote: Quote
  company: CompanySettings
  totals: QuoteTotals
  locale: string
}

export function QuotePrintView({ quote, company, totals, locale }: QuotePrintViewProps) {
  const { t } = useTranslation()

  return (
    <div className="hidden print:block">
      <div className="mb-6 border-b border-black pb-4">
        <div className="flex justify-between gap-6">
          <div>
            {company.logo ? (
              <img src={company.logo} alt="" className="mb-2 h-12 object-contain" />
            ) : null}
            <p className="text-lg font-bold">{company.name || t('quotes.print.companyPlaceholder')}</p>
            {company.address ? <p className="text-xs">{company.address}</p> : null}
            {company.taxNumber ? (
              <p className="text-xs">
                {t('quotes.print.taxNumber')}: {company.taxNumber}
              </p>
            ) : null}
            {company.phone ? <p className="text-xs">{company.phone}</p> : null}
            {company.email ? <p className="text-xs">{company.email}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">
              {t('quotes.print.quoteTitle', { number: quote.number })}
            </p>
            <p className="text-xs">
              {t('quotes.print.date')}: {quote.date}
            </p>
            {quote.validUntil ? (
              <p className="text-xs">
                {t('quotes.print.validUntil')}: {quote.validUntil}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase">{t('quotes.print.client')}</p>
        <p className="font-medium">{quote.client.name}</p>
        {quote.client.address ? <p className="text-xs">{quote.client.address}</p> : null}
        {quote.client.taxNumber ? (
          <p className="text-xs">
            {t('quotes.print.taxNumber')}: {quote.client.taxNumber}
          </p>
        ) : null}
      </div>

      {quote.items.length > 0 ? (
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">{t('quotes.items.title')}</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left">{t('quotes.items.description')}</th>
                <th className="py-1 text-right">{t('quotes.items.qty')}</th>
                <th className="py-1 text-left">{t('quotes.items.unit')}</th>
                <th className="py-1 text-right">{t('quotes.items.sale')}</th>
                <th className="py-1 text-right">{t('quotes.items.total')}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-1">{item.description}</td>
                  <td className="py-1 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-1">{item.unit}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatCurrency(item.saleUnitPrice, locale)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatCurrency(item.saleTotal, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {quote.labor.length > 0 ? (
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">{t('quotes.labor.title')}</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left">{t('quotes.labor.description')}</th>
                <th className="py-1 text-right">{t('quotes.items.qty')}</th>
                <th className="py-1 text-left">{t('quotes.items.unit')}</th>
                <th className="py-1 text-right">{t('quotes.labor.sale')}</th>
                <th className="py-1 text-right">{t('quotes.items.total')}</th>
              </tr>
            </thead>
            <tbody>
              {quote.labor.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-1">{item.description}</td>
                  <td className="py-1 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-1">{t(`quotes.labor.units.${item.unit}`)}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatCurrency(item.salePerUnit, locale)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatCurrency(item.totalSale, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <div className="ml-auto mt-4 w-64 text-xs">
        <div className="flex justify-between py-1">
          <span>{t('quotes.summary.subtotal')}</span>
          <span>{formatCurrency(totals.totalSale, locale)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between py-1">
            <span>{t('quotes.summary.discount')}</span>
            <span>-{formatCurrency(totals.discount, locale)}</span>
          </div>
        ) : null}
        <div className="flex justify-between py-1">
          <span>{t('quotes.summary.beforeTax')}</span>
          <span>{formatCurrency(totals.subtotalAfterDiscount, locale)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{t('quotes.summary.tax', { rate: totals.taxRate })}</span>
          <span>{formatCurrency(totals.taxAmount, locale)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-2 font-bold">
          <span>{t('quotes.summary.grandTotal')}</span>
          <span>{formatCurrency(totals.grandTotal, locale)}</span>
        </div>
      </div>

      {quote.notes ? (
        <section className="mt-6">
          <p className="text-xs font-semibold">{t('quotes.print.notes')}</p>
          <p className="whitespace-pre-wrap text-xs">{quote.notes}</p>
        </section>
      ) : null}

      {quote.terms ? (
        <section className="mt-4">
          <p className="text-xs font-semibold">{t('quotes.print.terms')}</p>
          <p className="whitespace-pre-wrap text-xs">{quote.terms}</p>
        </section>
      ) : null}
    </div>
  )
}
