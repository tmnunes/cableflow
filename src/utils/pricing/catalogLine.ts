import type { Material } from '@/types/material'
import { roundMoney } from '@/utils/money'

export function isMeterUnit(unit: string): boolean {
  return unit === 'meter' || unit === 'metre'
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

export function lineUnitForCatalogSelection(
  material: Pick<Material, 'unit' | 'metersPerRoll'>,
  currentUnit: string,
  keepMeters: boolean,
): string {
  if (keepMeters || isMeterUnit(currentUnit)) {
    if (material.unit === 'roll' && material.metersPerRoll && material.metersPerRoll > 0) {
      return 'meter'
    }
    if (keepMeters) return 'meter'
  }
  return material.unit
}
