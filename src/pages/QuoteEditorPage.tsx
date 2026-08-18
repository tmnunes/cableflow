import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MaterialPickerDialog } from '@/components/quotes/MaterialPickerDialog'
import {
  addMaterialToQuoteItems,
  QuoteItemsTable,
} from '@/components/quotes/QuoteItemsTable'
import { QuoteLaborTable } from '@/components/quotes/QuoteLaborTable'
import { QuotePrintView } from '@/components/quotes/QuotePrintView'
import { QuoteSummaryPanel } from '@/components/quotes/QuoteSummaryPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppData } from '@/hooks/useAppData'
import type { Quote, QuoteStatus } from '@/types'
import { cn } from '@/utils/cn'
import {
  aggregateCableRequirements,
  diffAggregatedCableQuantities,
  syncQuoteCableItemsFromProject,
} from '@/utils/cable/quoteImport'
import { applyGlobalMarginToQuote, calculateQuoteTotals, normalizeQuote } from '@/utils/quotes'

const STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired']

export function QuoteEditorPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const { t } = useTranslation()
  const {
    quotes,
    upsertQuote,
    materials,
    companySettings,
    locale,
    projects,
  } = useAppData()

  const stored = quotes.find((q) => q.id === quoteId)
  const [quote, setQuote] = useState<Quote | null>(stored ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (stored) setQuote(stored)
  }, [stored])

  const save = useCallback(
    (next: Quote) => {
      const normalized = normalizeQuote(next)
      setQuote(normalized)
      upsertQuote(normalized)
    },
    [upsertQuote],
  )

  const totals = useMemo(
    () => (quote ? calculateQuoteTotals(quote) : null),
    [quote],
  )

  const cableDiffs = useMemo(() => {
    if (!quote?.projectId) return []
    const project = projects.find((p) => p.id === quote.projectId)
    if (!project) return []
    const requirements = aggregateCableRequirements(project)
    return diffAggregatedCableQuantities(requirements, quote.items)
  }, [quote, projects])

  if (!quoteId || !quote) {
    return <Navigate to="/quotes" replace />
  }

  const patch = (p: Partial<Quote>) => save({ ...quote, ...p })

  const patchClient = (field: keyof Quote['client'], value: string) =>
    patch({ client: { ...quote.client, [field]: value } })

  const applyGlobalMargin = () => {
    const margin = quote.globalMarginPercent ?? companySettings.defaultMargin
    save(applyGlobalMarginToQuote(quote, margin))
    toast.success(t('quotes.marginApplied'))
  }

  const handleUpdateQuantities = () => {
    if (!quote.projectId) return
    const project = projects.find((p) => p.id === quote.projectId)
    if (!project) return
    const newItems = syncQuoteCableItemsFromProject(quote, project)
    save(normalizeQuote({ ...quote, items: newItems }))
    toast.success(t('quotes.quantitiesUpdated'))
  }

  return (
    <div className="space-y-4">
      <QuotePrintView
        quote={quote}
        company={companySettings}
        totals={totals!}
        locale={locale}
      />

      <div className="no-print space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{quote.number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('quotes.editorSubtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              {t('header.print')}
            </Button>
            <Button variant="outline" onClick={applyGlobalMargin}>
              {t('quotes.applyGlobalMargin')}
            </Button>
          </div>
        </div>

        {cableDiffs.length > 0 ? (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium">{t('quotes.cableDiffTitle')}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {cableDiffs.map((d) => (
                  <li key={d.requirementKey}>
                    {d.conductorCode} · {d.sectionMm2} mm²:{' '}
                    {d.quotedMeters} m → {d.currentMeters} m ({d.delta > 0 ? '+' : ''}
                    {d.delta} m)
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-3" onClick={handleUpdateQuantities}>
                {t('quotes.updateQuantities')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">{t('quotes.client.title')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label={t('quotes.client.name')}>
                  <Input
                    value={quote.client.name}
                    onChange={(e) => patchClient('name', e.target.value)}
                  />
                </Field>
                <Field label={t('quotes.client.taxNumber')}>
                  <Input
                    value={quote.client.taxNumber ?? ''}
                    onChange={(e) => patchClient('taxNumber', e.target.value)}
                  />
                </Field>
                <Field label={t('quotes.client.email')}>
                  <Input
                    value={quote.client.email ?? ''}
                    onChange={(e) => patchClient('email', e.target.value)}
                  />
                </Field>
                <Field label={t('quotes.client.phone')}>
                  <Input
                    value={quote.client.phone ?? ''}
                    onChange={(e) => patchClient('phone', e.target.value)}
                  />
                </Field>
                <Field label={t('quotes.client.address')} className="sm:col-span-2">
                  <Input
                    value={quote.client.address ?? ''}
                    onChange={(e) => patchClient('address', e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label={t('quotes.fields.date')}>
                  <Input
                    type="date"
                    value={quote.date}
                    onChange={(e) => patch({ date: e.target.value })}
                    className="h-9"
                  />
                </Field>
                <Field label={t('quotes.fields.validUntil')}>
                  <Input
                    type="date"
                    value={quote.validUntil ?? ''}
                    onChange={(e) => patch({ validUntil: e.target.value })}
                    className="h-9"
                  />
                </Field>
                <Field label={t('quotes.fields.status')}>
                  <Select
                    value={quote.status}
                    onValueChange={(v) => patch({ status: v as QuoteStatus })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`quotes.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('quotes.fields.taxRate')}>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={quote.taxRate}
                    onChange={(e) => patch({ taxRate: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </Field>
              </CardContent>
            </Card>

            <QuoteItemsTable
              items={quote.items}
              locale={locale}
              defaultMargin={quote.globalMarginPercent ?? companySettings.defaultMargin}
              onChange={(items) => patch({ items })}
              onPickMaterial={() => setPickerOpen(true)}
            />

            <QuoteLaborTable
              items={quote.labor}
              locale={locale}
              defaultMargin={quote.globalMarginPercent ?? companySettings.defaultMargin}
              onChange={(labor) => patch({ labor })}
            />

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">{t('quotes.notes.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={quote.notes ?? ''}
                  onChange={(e) => patch({ notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={t('quotes.notes.placeholder')}
                />
                <textarea
                  value={quote.terms ?? ''}
                  onChange={(e) => patch({ terms: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={t('quotes.terms.placeholder')}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t('quotes.fields.discount')}>
                    <div className="flex gap-2">
                      <Select
                        value={quote.discountType ?? 'amount'}
                        onValueChange={(v) =>
                          patch({ discountType: v as 'amount' | 'percent' })
                        }
                      >
                        <SelectTrigger className="h-9 w-[8.5rem] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">
                            {t('quotes.fields.discountAmount')}
                          </SelectItem>
                          <SelectItem value="percent">
                            {t('quotes.fields.discountPercent')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        step={quote.discountType === 'percent' ? '0.1' : '0.01'}
                        value={quote.discount ?? 0}
                        onChange={(e) => patch({ discount: Number(e.target.value) || 0 })}
                        className="h-9"
                      />
                    </div>
                  </Field>
                  <Field label={t('quotes.fields.globalMargin')}>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      step="0.1"
                      value={quote.globalMarginPercent ?? companySettings.defaultMargin}
                      onChange={(e) =>
                        patch({ globalMarginPercent: Number(e.target.value) || 0 })
                      }
                      className="h-9"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>

          {totals ? (
            <QuoteSummaryPanel totals={totals} locale={locale} showInternal />
          ) : null}
        </div>
      </div>

      <MaterialPickerDialog
        materials={materials}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(material, quantity) => {
          patch({
            items: addMaterialToQuoteItems(
              quote.items,
              material,
              quantity,
              quote.globalMarginPercent ?? companySettings.defaultMargin,
            ),
          })
        }}
      />
    </div>
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
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="h-4 whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}
