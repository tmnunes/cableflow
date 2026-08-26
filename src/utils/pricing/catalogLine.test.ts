import { describe, expect, it } from 'vitest'
import {
  catalogPriceForLine,
  lineUnitForCatalogSelection,
  purchaseFromRollCatalog,
  rollsNeededForMeters,
} from '@/utils/pricing/catalogLine'

describe('roll materials priced against metre quantities', () => {
  it('charges 50m at half of a 100m roll price', () => {
    const unitPrice = catalogPriceForLine(
      { unit: 'roll', purchasePrice: 80, metersPerRoll: 100 },
      'meter',
    )
    expect(unitPrice).toBe(0.8)
    expect(50 * unitPrice).toBe(40)
  })

  it('keeps the full roll price when the line is still in rolls', () => {
    expect(
      catalogPriceForLine({ unit: 'roll', purchasePrice: 80, metersPerRoll: 100 }, 'roll'),
    ).toBe(80)
  })

  it('uses roll unit for cable lines when a roll with length is selected', () => {
    expect(
      lineUnitForCatalogSelection(
        { unit: 'roll', metersPerRoll: 100 },
        'unit',
        true,
      ),
    ).toBe('roll')
  })
})

describe('whole-roll purchase by excess', () => {
  it('rounds 170 m up to 2 × 100 m rolls', () => {
    expect(rollsNeededForMeters(170, 100)).toBe(2)
    expect(
      purchaseFromRollCatalog(170, {
        unit: 'roll',
        purchasePrice: 34.85,
        metersPerRoll: 100,
      }),
    ).toEqual({
      quantity: 2,
      unit: 'roll',
      unitPrice: 34.85,
      coveredMeters: 200,
      metersPerRoll: 100,
    })
  })

  it('keeps an exact multiple as-is', () => {
    expect(rollsNeededForMeters(200, 100)).toBe(2)
    expect(rollsNeededForMeters(100, 100)).toBe(1)
  })

  it('returns null when the catalog item is not a sized roll', () => {
    expect(
      purchaseFromRollCatalog(170, { unit: 'meter', purchasePrice: 0.8 }),
    ).toBeNull()
  })
})
