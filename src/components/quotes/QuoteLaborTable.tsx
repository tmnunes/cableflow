import { Copy, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import type { LaborItem, LaborUnit } from '@/types'
import { formatCurrency, parseMoneyInput } from '@/utils/money'
import { calculateMarginPrice } from '@/utils/pricing'
import { recalculateLaborItem } from '@/utils/quotes'
import { createId } from '@/utils/cn'

const LABOR_UNITS: LaborUnit[] = ['hour', 'day', 'unit', 'fixed']

interface QuoteLaborTableProps {
  items: LaborItem[]
  locale: string
  defaultMargin: number
  onChange: (items: LaborItem[]) => void
}

export function QuoteLaborTable({
  items,
  locale,
  defaultMargin,
  onChange,
}: QuoteLaborTableProps) {
  const { t } = useTranslation()

  const updateItem = (id: string, patch: Partial<LaborItem>) => {
    onChange(
      items.map((item) =>
        item.id === id ? recalculateLaborItem({ ...item, ...patch }) : item,
      ),
    )
  }

  const addItem = () => {
    onChange([
      ...items,
      recalculateLaborItem({
        id: createId(),
        description: t('quotes.labor.defaultDescription'),
        quantity: 1,
        unit: 'hour',
        costPerUnit: 0,
        salePerUnit: 0,
        totalCost: 0,
        totalSale: 0,
      }),
    ])
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('quotes.labor.title')}</CardTitle>
        <Button variant="outline" size="sm" onClick={addItem} className="no-print">
          <Plus className="h-4 w-4" />
          {t('quotes.labor.add')}
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">{t('quotes.labor.description')}</th>
                <th className="px-3 py-2 w-24">{t('quotes.items.qty')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.items.unit')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.labor.cost')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.labor.sale')}</th>
                <th className="px-3 py-2 w-28">{t('quotes.items.total')}</th>
                <th className="px-3 py-2 w-20 no-print">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {t('quotes.labor.empty')}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 align-top">
                    <td className="px-3 py-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      />
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
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateItem(item.id, { unit: v as LaborUnit })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LABOR_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {t(`quotes.labor.units.${u}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={String(item.costPerUnit)}
                        onBlur={(e) => {
                          const v = parseMoneyInput(e.target.value)
                          if (v !== null) updateItem(item.id, { costPerUnit: v })
                        }}
                        className="font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        defaultValue={String(item.salePerUnit)}
                        onBlur={(e) => {
                          const v = parseMoneyInput(e.target.value)
                          if (v !== null) updateItem(item.id, { salePerUnit: v })
                        }}
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-[10px] underline no-print"
                        onClick={() =>
                          updateItem(item.id, {
                            salePerUnit: calculateMarginPrice(
                              item.costPerUnit,
                              item.marginPercent ?? defaultMargin,
                            ),
                          })
                        }
                      >
                        {t('quotes.applyMargin')}
                      </Button>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {formatCurrency(item.totalSale, locale)}
                    </td>
                    <td className="px-3 py-2 no-print">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onChange([
                              ...items,
                              recalculateLaborItem({
                                ...item,
                                id: createId(),
                              }),
                            ])
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onChange(items.filter((i) => i.id !== item.id))}
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
