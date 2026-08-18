import { describe, expect, it } from 'vitest'
import { catalogPriceForLine, lineUnitForCatalogSelection } from '@/utils/pricing/catalogLine'

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

  it('uses metre unit for cable lines when a roll with length is selected', () => {
    expect(
      lineUnitForCatalogSelection(
        { unit: 'roll', metersPerRoll: 100 },
        'unit',
        true,
      ),
    ).toBe('meter')
  })
})
