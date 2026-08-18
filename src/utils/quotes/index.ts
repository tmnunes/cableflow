import type { LaborItem, Quote, QuoteItem } from '@/types/quote'
import {
  applyDiscount,
  calculateLineTotals,
  calculateMargin,
  calculateMarkup,
  calculateProfit,
  calculateTax,
  calculateTotalWithTax,
  resolveDiscountAmount,
} from '@/utils/pricing'
import { roundMoney } from '@/utils/money'

export interface QuoteTotals {
  materialsPurchase: number
  materialsSale: number
  laborCost: number
  laborSale: number
  totalCost: number
  totalSale: number
  discount: number
  subtotalAfterDiscount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  grossProfit: number
  marginPercent: number
  markupPercent: number
}

export function recalculateQuoteItem(item: QuoteItem): QuoteItem {
  const totals = calculateLineTotals(item.quantity, item.purchaseUnitPrice, item.saleUnitPrice)
  return {
    ...item,
    purchaseTotal: totals.purchaseTotal,
    saleTotal: totals.saleTotal,
    marginPercent: totals.marginPercent,
  }
}

export function recalculateLaborItem(item: LaborItem): LaborItem {
  const totalCost = roundMoney(item.quantity * item.costPerUnit)
  const totalSale = roundMoney(item.quantity * item.salePerUnit)
  return {
    ...item,
    totalCost,
    totalSale,
    marginPercent: calculateMargin(totalSale, totalCost),
  }
}

export function calculateQuoteTotals(quote: Quote): QuoteTotals {
  const items = quote.items.map(recalculateQuoteItem)
  const labor = quote.labor.map(recalculateLaborItem)

  const materialsPurchase = roundMoney(items.reduce((s, i) => s + i.purchaseTotal, 0))
  const materialsSale = roundMoney(items.reduce((s, i) => s + i.saleTotal, 0))
  const laborCost = roundMoney(labor.reduce((s, l) => s + l.totalCost, 0))
  const laborSale = roundMoney(labor.reduce((s, l) => s + l.totalSale, 0))

  const totalCost = roundMoney(materialsPurchase + laborCost)
  const totalSale = roundMoney(materialsSale + laborSale)
  const discount = resolveDiscountAmount(
    totalSale,
    quote.discount ?? 0,
    quote.discountType ?? 'amount',
  )
  const subtotalAfterDiscount = applyDiscount(totalSale, discount)
  const taxRate = quote.taxRate ?? 0
  const taxAmount = calculateTax(subtotalAfterDiscount, taxRate)
  const grandTotal = calculateTotalWithTax(subtotalAfterDiscount, taxRate)
  const grossProfit = calculateProfit(subtotalAfterDiscount, totalCost)
  const marginPercent = calculateMargin(subtotalAfterDiscount, totalCost)
  const markupPercent = calculateMarkup(subtotalAfterDiscount, totalCost)

  return {
    materialsPurchase,
    materialsSale,
    laborCost,
    laborSale,
    totalCost,
    totalSale,
    discount,
    subtotalAfterDiscount,
    taxRate,
    taxAmount,
    grandTotal,
    grossProfit,
    marginPercent,
    markupPercent,
  }
}

/** Apply global margin to all item/labor sale prices from their costs */
export function applyGlobalMarginToQuote(quote: Quote, marginPercent: number): Quote {
  return {
    ...quote,
    globalMarginPercent: marginPercent,
    items: quote.items.map((item) => {
      const saleUnitPrice = marginPercent > 0
        ? roundMoney(item.purchaseUnitPrice / (1 - marginPercent / 100))
        : item.purchaseUnitPrice
      return recalculateQuoteItem({ ...item, saleUnitPrice, marginPercent })
    }),
    labor: quote.labor.map((item) => {
      const salePerUnit = marginPercent > 0
        ? roundMoney(item.costPerUnit / (1 - marginPercent / 100))
        : item.costPerUnit
      return recalculateLaborItem({ ...item, salePerUnit, marginPercent })
    }),
  }
}

export function normalizeQuote(quote: Quote): Quote {
  return {
    ...quote,
    items: quote.items.map(recalculateQuoteItem),
    labor: quote.labor.map(recalculateLaborItem),
  }
}
