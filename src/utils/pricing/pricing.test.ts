import { describe, expect, it } from 'vitest'
import {
  calculateMargin,
  calculateMarginPrice,
  calculateMarkup,
  calculateMarkupPrice,
  calculateTax,
  calculateTotalWithTax,
} from '@/utils/pricing'
import { calculateQuoteTotals, recalculateQuoteItem } from '@/utils/quotes'
import type { Quote } from '@/types/quote'

describe('pricing margin vs markup', () => {
  it('calculates sale price from 20% margin on cost 100 → 125', () => {
    expect(calculateMarginPrice(100, 20)).toBe(125)
  })

  it('calculates sale price from 25% markup on cost 100 → 125', () => {
    expect(calculateMarkupPrice(100, 25)).toBe(125)
  })

  it('margin 20% means profit 25 on sale 125', () => {
    expect(calculateMargin(125, 100)).toBe(20)
    expect(calculateMarkup(125, 100)).toBe(25)
  })

  it('margin and markup are not interchangeable at same percentage', () => {
    const marginSale = calculateMarginPrice(100, 25)
    const markupSale = calculateMarkupPrice(100, 25)
    expect(marginSale).toBeCloseTo(133.33, 2)
    expect(markupSale).toBe(125)
    expect(marginSale).not.toBe(markupSale)
  })
})

describe('tax calculations', () => {
  it('calculates 23% VAT', () => {
    expect(calculateTax(1000, 23)).toBe(230)
    expect(calculateTotalWithTax(1000, 23)).toBe(1230)
  })

  it('supports custom tax rate', () => {
    expect(calculateTax(100, 6)).toBe(6)
  })
})

describe('quote totals', () => {
  const baseQuote: Quote = {
    id: 'q1',
    number: 'ORC-2026-001',
    client: { name: 'Test' },
    date: '2026-01-01',
    status: 'draft',
    items: [
      recalculateQuoteItem({
        id: 'i1',
        description: 'Cable',
        category: 'cables',
        quantity: 100,
        unit: 'meter',
        purchaseUnitPrice: 0.42,
        saleUnitPrice: 0.65,
        purchaseTotal: 0,
        saleTotal: 0,
      }),
    ],
    labor: [],
    taxRate: 23,
    createdAt: '',
    updatedAt: '',
  }

  it('sums material totals correctly', () => {
    const totals = calculateQuoteTotals(baseQuote)
    expect(totals.materialsPurchase).toBe(42)
    expect(totals.materialsSale).toBe(65)
    expect(totals.grandTotal).toBeCloseTo(79.95, 2)
  })

  it('applies discount before tax', () => {
    const totals = calculateQuoteTotals({ ...baseQuote, discount: 5 })
    expect(totals.subtotalAfterDiscount).toBe(60)
    expect(totals.taxAmount).toBeCloseTo(13.8, 2)
    expect(totals.grandTotal).toBeCloseTo(73.8, 2)
  })
})
