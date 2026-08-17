const CURRENCY = 'EUR'

/** Convert euros to integer cents */
export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

/** Convert cents to euros */
export function fromCents(cents: number): number {
  return cents / 100
}

/** Round to 2 decimal places (euros) */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Format as currency string */
export function formatCurrency(
  value: number,
  locale: string,
  options?: { minimumFractionDigits?: number },
): string {
  const lang = locale === 'pt' ? 'pt-PT' : 'en-GB'
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Parse user input like "0,42" or "0.42" to euros */
export function parseMoneyInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized) return null
  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return roundMoney(value)
}
