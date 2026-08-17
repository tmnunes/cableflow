export interface CompanySettings {
  name: string
  taxNumber?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  logo?: string
  defaultTaxRate: number
  defaultMargin: number
  quotePrefix: string
}

export interface QuoteNumberState {
  prefix: string
  year: number
  lastSequence: number
}

export function defaultCompanySettings(): CompanySettings {
  return {
    name: '',
    defaultTaxRate: 23,
    defaultMargin: 25,
    quotePrefix: 'ORC',
  }
}

export function defaultQuoteNumberState(prefix = 'ORC'): QuoteNumberState {
  return {
    prefix,
    year: new Date().getFullYear(),
    lastSequence: 0,
  }
}
