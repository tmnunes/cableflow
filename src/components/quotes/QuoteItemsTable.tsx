import { Copy, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Material, QuoteItem } from '@/types'
import { formatCurrency, parseMoneyInput } from '@/utils/money'
import { calculateMarginPrice } from '@/utils/pricing'
import { recalculateQuoteItem } from '@/utils/quotes'
import { createId } from '@/utils/cn'

interface QuoteItemsTableProps {
  items: QuoteItem[]
  locale: string
  defaultMargin: number
  onChange: (items: QuoteItem[]) => void
  onPickMaterial: () => void
}

export function QuoteItemsTable({
  items,
  locale,
  defaultMargin,
  onChange,
  onPickMaterial,
}: QuoteItemsTableProps) {
  const { t } = useTranslation()

  const updateItem = (id: string, patch: Partial<QuoteItem>) => {
    onChange(
      items.map((item) =>
        item.id === id ? recalculateQuoteItem({ ...item, ...patch }) : item,
      ),
    )
  }

  const addManual = () => {
    const item = recalculateQuoteItem({
      id: createId(),
      description: t('quotes.newLine'),
      category: 'other',
      quantity: 1,
      unit: 'unit',
      purchaseUnitPrice: 0,
      saleUnitPrice: 0,
      purchaseTotal: 0,
      saleTotal: 0,
      source: { source: 'manual' },
    })
    onChange([...items, item])
  }

  const duplicate = (source: QuoteItem) => {
    onChange([
      ...items,
      recalculateQuoteItem({
        ...source,
        id: createId(),
        source: source.source ? { ...source.source } : { source: 'manual' },
      }),
    ])
  }

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  const applyMargin = (item: QuoteItem) => {
    const margin = item.marginPercent ?? defaultMargin
    updateItem(item.id, {
      saleUnitPrice: calculateMarginPrice(item.purchaseUnitPrice, margin),
      marginPercent: margin,
    })
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('quotes.items.title')}</CardTitle>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={onPickMaterial}>
            <Plus className="h-4 w-4" />
            {t('quotes.items.fromCatalog')}
          </Button>
          <Button variant="outline" size="sm" onClick={addManual}>
            <Plus className="h-4 w-4" />
            {t('quotes.items.manual')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">{t('quotes.items.description')}</th>
                <th className="px-3 py-2 w-24">{t('quotes.items.qty')}</th>
                <th className="px-3 py-2 w-20">{t('quotes.items.unit')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.items.purchase')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.items.sale')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.items.total')}</th>
                <th className="px-3 py-2 w-20 no-print">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {t('quotes.items.empty')}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 align-top hover:bg-muted/10">
                    <td className="px-3 py-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className="min-w-[200px]"
                      />
                      {item.source?.source === 'cableflow' ? (
                        <span className="mt-1 block text-[10px] text-primary">
                          {t('quotes.items.fromCableflow')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                        }
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={String(item.purchaseUnitPrice)}
                        onBlur={(e) => {
                          const v = parseMoneyInput(e.target.value)
                          if (v !== null) updateItem(item.id, { purchaseUnitPrice: v })
                        }}
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={String(item.saleUnitPrice)}
                        onBlur={(e) => {
                          const v = parseMoneyInput(e.target.value)
                          if (v !== null) updateItem(item.id, { saleUnitPrice: v })
                        }}
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-[10px] underline no-print"
                        onClick={() => applyMargin(item)}
                      >
                        {t('quotes.applyMargin')}
                      </Button>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {formatCurrency(item.saleTotal, locale)}
                    </td>
                    <td className="px-3 py-2 no-print">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => duplicate(item)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function addMaterialToQuoteItems(
  items: QuoteItem[],
  material: Material,
  quantity: number,
  defaultMargin: number,
): QuoteItem[] {
  const saleUnitPrice =
    material.salePrice ?? calculateMarginPrice(material.purchasePrice, defaultMargin)

  const item = recalculateQuoteItem({
    id: createId(),
    materialId: material.id,
    description: material.name,
    category: material.category,
    quantity,
    unit: material.unit,
    purchaseUnitPrice: material.purchasePrice,
    saleUnitPrice,
    purchaseTotal: 0,
    saleTotal: 0,
    source: { source: 'manual' },
  })

  return [...items, item]
}
