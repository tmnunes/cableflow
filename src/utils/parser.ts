import type { ConductorCode, ParsedConductor, SpecParseOutcome } from '@/types'
import { CONDUCTOR_CODES_BY_LENGTH } from '@/data/circuits'

/**
 * Parses cable specification codes such as FTN, F2R, 2VJTN, 4VJ, 3F2N, FRTN.
 *
 * Grammar (left-to-right):
 *   Spec      := Segment+
 *   Segment   := Quantity? Code
 *   Quantity  := [1-9][0-9]*
 *   Code      := known conductor code (longest match first)
 *
 * If quantity is omitted, it defaults to 1.
 * Future codes: add to CONDUCTORS in data/circuits.ts.
 */
export function parseSpec(raw: string): SpecParseOutcome {
  const input = raw.trim().toUpperCase()

  if (!input) {
    return { ok: false, error: 'empty' }
  }

  const conductors: ParsedConductor[] = []
  let i = 0

  while (i < input.length) {
    // Skip whitespace / separators for resilience
    if (/\s/.test(input[i]!)) {
      i += 1
      continue
    }

    let quantity = 1
    const qtyStart = i

    if (/\d/.test(input[i]!)) {
      let qtyEnd = i
      while (qtyEnd < input.length && /\d/.test(input[qtyEnd]!)) {
        qtyEnd += 1
      }
      const qtyStr = input.slice(i, qtyEnd)
      quantity = Number.parseInt(qtyStr, 10)
      if (!Number.isFinite(quantity) || quantity < 1) {
        return { ok: false, error: 'invalidQuantity', position: qtyStart }
      }
      i = qtyEnd
    }

    if (i >= input.length) {
      return { ok: false, error: 'trailingQuantity', position: qtyStart }
    }

    const matched = matchCode(input, i)
    if (!matched) {
      return { ok: false, error: 'unknownCode', position: i }
    }

    conductors.push({ code: matched.code, quantity })
    i += matched.code.length
  }

  if (conductors.length === 0) {
    return { ok: false, error: 'empty' }
  }

  return { ok: true, conductors: mergeConductors(conductors) }
}

function matchCode(
  input: string,
  index: number,
): { code: ConductorCode } | null {
  for (const code of CONDUCTOR_CODES_BY_LENGTH) {
    if (input.startsWith(code, index)) {
      return { code }
    }
  }
  return null
}

/** Merge duplicate codes (e.g. F2F → 3×F) into a stable insertion order */
function mergeConductors(items: ParsedConductor[]): ParsedConductor[] {
  const order: ConductorCode[] = []
  const totals = new Map<ConductorCode, number>()

  for (const item of items) {
    if (!totals.has(item.code)) {
      order.push(item.code)
      totals.set(item.code, 0)
    }
    totals.set(item.code, (totals.get(item.code) ?? 0) + item.quantity)
  }

  return order.map((code) => ({
    code,
    quantity: totals.get(code)!,
  }))
}

/** True when the spec parses successfully */
export function isValidSpec(raw: string): boolean {
  return parseSpec(raw).ok
}

/** Total conductor count inside a parsed specification */
export function countConductors(conductors: ParsedConductor[]): number {
  return conductors.reduce((sum, c) => sum + c.quantity, 0)
}

/** Human-readable breakdown for tooltips */
export function formatSpecBreakdown(conductors: ParsedConductor[]): string {
  return conductors.map((c) => `${c.quantity}× ${c.code}`).join(' · ')
}

/**
 * Accepts a plain integer, or legacy strings like "4" / "4C".
 * Returns null when the value is not a positive integer.
 */
export function parseConduitValue(raw: unknown): number | null {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) return null
    return raw
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const match = /^(\d+)\s*C?$/i.exec(trimmed)
    if (!match) return null
    const value = Number.parseInt(match[1]!, 10)
    if (!Number.isInteger(value) || value < 1) return null
    return value
  }

  return null
}
