import { describe, expect, it } from 'vitest'
import { EXAMPLE_LOAD_TYPES } from '@/data/electrical/exampleLoadTypes'
import { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'
import { calculateCircuitDesign } from '@/utils/electrical/circuitDesign'
import type { ElectricalSystem } from '@/types/electrical'

/** Loads that are typically wired three-phase in dwellings. */
const THREE_PHASE_LOAD_IDS = new Set([
  'example-load-hob',
  'example-load-instant-water-heater-3p',
  'example-load-heat-pump-3p',
  'example-load-ev-charger-11',
  'example-load-ev-charger-22',
])

describe('residential dwelling coverage', () => {
  it('ships a broad example load catalog for typical homes', () => {
    const names = EXAMPLE_LOAD_TYPES.map((item) => item.name.toLowerCase())
    expect(EXAMPLE_LOAD_TYPES.length).toBeGreaterThanOrEqual(25)
    expect(names.some((name) => name.includes('fridge') || name.includes('frigorífico'))).toBe(true)
    expect(names.some((name) => name.includes('american'))).toBe(true)
    expect(names.some((name) => name.includes('oven') || name.includes('forno'))).toBe(true)
    expect(names.some((name) => name.includes('induction') || name.includes('indução'))).toBe(true)
    expect(names.some((name) => name.includes('heat pump') || name.includes('bomba de calor'))).toBe(true)
    expect(names.some((name) => name.includes('pool'))).toBe(true)
    expect(names.some((name) => name.includes('sewage') || name.includes('esgoto'))).toBe(true)
    expect(names.some((name) => name.includes('washing') || name.includes('roupa'))).toBe(true)
    expect(names.some((name) => name.includes('air conditioning') || name.includes('ac'))).toBe(true)
    expect(names.some((name) => name.includes('esquentador') || name.includes('instantaneous'))).toBe(true)
  })

  it('finds a protection for every example dwelling load at default power', () => {
    for (const loadType of EXAMPLE_LOAD_TYPES) {
      const system: ElectricalSystem = THREE_PHASE_LOAD_IDS.has(loadType.id)
        ? 'three-phase'
        : 'single-phase'

      const result = calculateCircuitDesign({
        circuit: {
          category: loadType.category,
          loads: [
            {
              id: loadType.id,
              loadTypeId: loadType.id,
              quantity: 1,
              unitPower: loadType.defaultUnitPower,
              powerFactor: loadType.defaultPowerFactor ?? 1,
            },
          ],
          installation: { length: 15, systemPhase: system, voltage: 230 },
        },
        ruleSet: EXAMPLE_ELECTRICAL_RULE_SET,
        loadTypes: EXAMPLE_LOAD_TYPES.map((item) => ({
          ...item,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        })),
        calculatedAt: '2026-08-24T00:00:00.000Z',
      })

      expect(
        result.errors,
        `${loadType.name} (${system}) should not fail protection coverage`,
      ).not.toContain('noProtectionCoversDesignCurrent')
      expect(
        result.protection?.option?.rating,
        `${loadType.name} (${system}, Ib=${result.designCurrent} A) should recommend In`,
      ).toBeGreaterThanOrEqual(result.designCurrent)
    }
  })

  it('covers critical high-current dwelling cases', () => {
    const cases: Array<{
      name: string
      category: string
      power: number
      system: ElectricalSystem
      minIn: number
      poles?: number
    }> = [
      { name: 'induction hob 1P 7.4 kW', category: 'kitchen', power: 7400, system: 'single-phase', minIn: 40 },
      { name: 'induction hob 3P 11 kW', category: 'kitchen', power: 11000, system: 'three-phase', minIn: 32, poles: 3 },
      { name: 'instant heater 7.5 kW', category: 'waterHeating', power: 7500, system: 'single-phase', minIn: 40 },
      { name: 'instant heater 18 kW 3P', category: 'waterHeating', power: 18000, system: 'three-phase', minIn: 50, poles: 3 },
      { name: 'EV 7.4 kW', category: 'power', power: 7400, system: 'single-phase', minIn: 40 },
      { name: 'EV 22 kW 3P', category: 'power', power: 22000, system: 'three-phase', minIn: 63, poles: 3 },
      { name: 'heat pump 9 kW 3P', category: 'hvac', power: 9000, system: 'three-phase', minIn: 25, poles: 3 },
      { name: 'oven 3.5 kW', category: 'kitchen', power: 3500, system: 'single-phase', minIn: 16 },
      { name: 'american fridge', category: 'kitchen', power: 600, system: 'single-phase', minIn: 16 },
      { name: 'pool pump', category: 'motor', power: 1100, system: 'single-phase', minIn: 16 },
    ]

    for (const item of cases) {
      const result = calculateCircuitDesign({
        circuit: {
          category: item.category,
          loads: [{ id: 'x', quantity: 1, unitPower: item.power, powerFactor: 1 }],
          installation: { length: 12, systemPhase: item.system, voltage: 230 },
        },
        ruleSet: EXAMPLE_ELECTRICAL_RULE_SET,
        calculatedAt: '2026-08-24T00:00:00.000Z',
      })

      expect(result.errors, item.name).not.toContain('noProtectionCoversDesignCurrent')
      expect(result.protection?.option?.rating, item.name).toBeGreaterThanOrEqual(item.minIn)
      if (item.poles) {
        expect(result.protection?.option?.poles, item.name).toBe(item.poles)
      }
    }
  })
})
