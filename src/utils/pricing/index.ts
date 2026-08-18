import { roundMoney } from '@/utils/money'

/**
 * Sale price from cost using margin % (profit / sale price).
 * Example: cost=100, margin=20 → sale=125
 */
export function calculateMarginPrice(cost: number, marginPercent: number): number {
  if (marginPercent >= 100) return cost
  if (marginPercent <= 0) return roundMoney(cost)
  return roundMoney(cost / (1 - marginPercent / 100))
}

/**
 * Sale price from cost using markup % (profit / cost).
 * Example: cost=100, markup=25 → sale=125
 */
export function calculateMarkupPrice(cost: number, markupPercent: number): number {
  if (markupPercent <= 0) return roundMoney(cost)
  return roundMoney(cost * (1 + markupPercent / 100))
}

/** Margin % from sale and cost: (sale - cost) / sale */
export function calculateMargin(salePrice: number, cost: number): number {
  if (salePrice <= 0) return 0
  return roundMoney(((salePrice - cost) / salePrice) * 100)
}

/** Markup % from sale and cost: (sale - cost) / cost */
export function calculateMarkup(salePrice: number, cost: number): number {
  if (cost <= 0) return 0
  return roundMoney(((salePrice - cost) / cost) * 100)
}

export function calculateProfit(salePrice: number, cost: number): number {
  return roundMoney(salePrice - cost)
}

/** Apply line totals from unit prices and quantity */
export function calculateLineTotals(
  quantity: number,
  purchaseUnitPrice: number,
  saleUnitPrice: number,
): { purchaseTotal: number; saleTotal: number; marginPercent: number } {
  const purchaseTotal = roundMoney(quantity * purchaseUnitPrice)
  const saleTotal = roundMoney(quantity * saleUnitPrice)
  const marginPercent = calculateMargin(saleTotal, purchaseTotal)
  return { purchaseTotal, saleTotal, marginPercent }
}

/** Subtotal after optional discount (absolute value in euros) */
export function applyDiscount(subtotal: number, discount = 0): number {
  return roundMoney(Math.max(0, subtotal - discount))
}

export type DiscountType = 'amount' | 'percent'

/** Convert stored discount value into a euro amount. */
export function resolveDiscountAmount(
  subtotal: number,
  discount = 0,
  type: DiscountType = 'amount',
): number {
  if (discount <= 0 || subtotal <= 0) return 0
  if (type === 'percent') {
    return roundMoney(subtotal * (Math.min(discount, 100) / 100))
  }
  return roundMoney(Math.min(subtotal, discount))
}

/** Tax amount from taxable base and rate % */
export function calculateTax(taxableBase: number, taxRate: number): number {
  return roundMoney(taxableBase * (taxRate / 100))
}

/** Total including tax */
export function calculateTotalWithTax(taxableBase: number, taxRate: number): number {
  return roundMoney(taxableBase + calculateTax(taxableBase, taxRate))
}
