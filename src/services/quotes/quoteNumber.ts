import type { QuoteNumberState } from '@/types/company'

export function formatQuoteNumber(state: QuoteNumberState, sequence: number, year?: number): string {
  const y = year ?? state.year
  return `${state.prefix}-${y}-${String(sequence).padStart(3, '0')}`
}

export function allocateQuoteNumber(state: QuoteNumberState): {
  number: string
  nextState: QuoteNumberState
} {
  const currentYear = new Date().getFullYear()
  let { prefix, year, lastSequence } = state

  if (year !== currentYear) {
    year = currentYear
    lastSequence = 0
  }

  lastSequence += 1
  const number = formatQuoteNumber({ prefix, year, lastSequence }, lastSequence, year)

  return {
    number,
    nextState: { prefix, year, lastSequence },
  }
}
