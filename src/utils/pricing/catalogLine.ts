import type { Material } from '@/types/material'
import { roundMoney } from '@/utils/money'

export function isMeterUnit(unit: string): boolean {
  return unit === 'meter' || unit === 'metre'
}

/** Whole rolls needed to cover a metre requirement (always rounds up). */
export function rollsNeededForMeters(meters: number, metersPerRoll: number): number {
  if (!(meters > 0) || !(metersPerRoll > 0)) return 0
  return Math.ceil(meters / metersPerRoll)
}

export type RollPurchase = {
  quantity: number
  unit: 'roll'
  unitPrice: number
  coveredMeters: number
  metersPerRoll: number
}

/**
 * Convert a metre requirement into whole-roll purchase quantities.
 * Example: 170 m with 100 m/roll → 2 rolls covering 200 m.
 */
export function purchaseFromRollCatalog(
  neededMeters: number,
  material: Pick<Material, 'unit' | 'purchasePrice' | 'metersPerRoll'>,
): RollPurchase | null {
  if (material.unit !== 'roll') return null
  const metersPerRoll = material.metersPerRoll ?? 0
  if (!(metersPerRoll > 0)) return null

  const quantity = rollsNeededForMeters(neededMeters, metersPerRoll)
  return {
    quantity,
    unit: 'roll',
    unitPrice: material.purchasePrice,
    coveredMeters: quantity * metersPerRoll,
    metersPerRoll,
  }
}

/** Price to apply on a project line from a catalog material. */
export function catalogPriceForLine(
  material: Pick<Material, 'unit' | 'purchasePrice' | 'metersPerRoll'>,
  lineUnit: string,
): number {
  if (
    material.unit === 'roll' &&
    isMeterUnit(lineUnit) &&
    material.metersPerRoll &&
    material.metersPerRoll > 0
  ) {
    return roundMoney(material.purchasePrice / material.metersPerRoll)
  }
  return material.purchasePrice
}

/**
 * Unit for a catalog pick.
 * Cable/metre lines stay on metres unless the caller switches to whole-roll purchase.
 */
export function lineUnitForCatalogSelection(
  material: Pick<Material, 'unit' | 'metersPerRoll'>,
  currentUnit: string,
  keepMeters: boolean,
): string {
  if (keepMeters || isMeterUnit(currentUnit)) {
    if (material.unit === 'roll' && material.metersPerRoll && material.metersPerRoll > 0) {
      // Prefer whole-roll purchase when metres are known — caller uses purchaseFromRollCatalog.
      return 'roll'
    }
    if (keepMeters) return 'meter'
  }
  return material.unit
}
