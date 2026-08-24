import { describe, expect, it } from 'vitest'
import { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'
import type { CircuitLoad, ElectricalRuleSet } from '@/types/electrical'
import {
  calculateCircuitDesign,
  calculateDesignCurrent,
  calculateDesignPower,
  calculateInstalledPower,
  selectConductorSection,
  selectProtection,
  validateProtection,
} from '@/utils/electrical'
import { buildQuoteItemsFromCircuits, createCableRunFromCircuit } from '@/utils/electrical/quoteIntegration'

const kitchenLights: CircuitLoad[] = [
  { id: 'a', quantity: 3, unitPower: 7 },
  { id: 'b', quantity: 1, unitPower: 10 },
  { id: 'c', quantity: 2, unitPower: 7 },
]

function ruleSetWithAmpacity(): ElectricalRuleSet {
  return {
    ...EXAMPLE_ELECTRICAL_RULE_SET,
    isExample: false,
    conductorRules: [
      {
        id: 'test-ampacity',
        conductorMaterial: 'copper',
        installationMethodId: 'unspecified',
        ampacityBySection: [
          { sectionMm2: 1.5, currentA: 16 },
          { sectionMm2: 2.5, currentA: 21 },
          { sectionMm2: 4, currentA: 28 },
        ],
      },
    ],
  }
}

describe('electrical power', () => {
  it('sums 3×7 W + 1×10 W + 2×7 W = 45 W', () => {
    expect(calculateInstalledPower(kitchenLights)).toBe(45)
  })

  it('applies utilization and simultaneity factors to design power', () => {
    const loads: CircuitLoad[] = [
      { id: 's1', quantity: 8, unitPower: 200, utilizationFactor: 0.3, simultaneityFactor: 0.5 },
    ]
    expect(calculateInstalledPower(loads)).toBe(1600)
    expect(calculateDesignPower(loads)).toBe(240)
  })
})

describe('electrical current', () => {
  it('calculates single-phase current as P / (U × cos φ)', () => {
    expect(calculateDesignCurrent({
      powerW: 2300,
      voltage: 230,
      powerFactor: 1,
      system: 'single-phase',
    })).toBeCloseTo(10, 5)
  })

  it('calculates three-phase current as P / (√3 × U × cos φ)', () => {
    expect(calculateDesignCurrent({
      powerW: 3983.7,
      voltage: 400,
      powerFactor: 1,
      system: 'three-phase',
    })).toBeCloseTo(5.75, 2)
  })

  it('does not assume cos φ = 1 when power factor is missing', () => {
    const current = calculateDesignCurrent({
      powerW: 2300,
      voltage: 230,
      system: 'single-phase',
    })
    expect(Number.isFinite(current)).toBe(false)
  })
})

describe('protection selection', () => {
  it('selects the smallest configured rating that covers Ib', () => {
    const result = selectProtection(
      { designCurrent: 8.2 },
      EXAMPLE_ELECTRICAL_RULE_SET,
    )
    expect(result.calculated).toBe(true)
    expect(result.option?.rating).toBe(10)
    expect(result.option?.type).toBe('MCB')
  })

  it('uses only protections allowed by the circuit rule', () => {
    const socketRule = EXAMPLE_ELECTRICAL_RULE_SET.circuitRules.find(
      (rule) => rule.circuitCategory === 'socket',
    )
    const result = selectProtection(
      { designCurrent: 8.2, circuitRule: socketRule },
      EXAMPLE_ELECTRICAL_RULE_SET,
    )
    expect(result.option?.rating).toBe(16)
  })
})

describe('conductor selection', () => {
  it('does not invent ampacity when the table is empty', () => {
    const result = selectConductorSection(
      {
        designCurrent: 10,
        allowedSections: [1.5, 2.5],
        defaultSection: 1.5,
        conductorMaterial: 'copper',
        voltage: 230,
        system: 'single-phase',
      },
      EXAMPLE_ELECTRICAL_RULE_SET,
    )
    expect(result.warnings).toContain('ampacityNotConfigured')
    expect(result.recommendationBasis).toBe('ruleDefault')
    expect(result.currentCapacity).toBeUndefined()
  })

  it('selects a section when ampacity data is configured', () => {
    const result = selectConductorSection(
      {
        designCurrent: 12,
        allowedSections: [1.5, 2.5, 4],
        conductorMaterial: 'copper',
        installationMethodId: 'unspecified',
        voltage: 230,
        system: 'single-phase',
      },
      ruleSetWithAmpacity(),
    )
    expect(result.recommendationBasis).toBe('ampacity')
    expect(result.recommendedSection).toBe(1.5)
    expect(result.currentCapacity).toBe(16)
  })
})

describe('coordination validation', () => {
  it('errors when Ib > In', () => {
    const result = validateProtection({
      designCurrent: 20,
      protectionRating: 16,
      conductorCapacity: 21,
      ampacityConfigured: true,
    })
    expect(result.status).toBe('error')
    expect(result.checks.some((check) => check.code === 'designCurrentExceedsProtection')).toBe(true)
  })

  it('errors when In > Iz', () => {
    const result = validateProtection({
      designCurrent: 10,
      protectionRating: 20,
      conductorCapacity: 16,
      ampacityConfigured: true,
    })
    expect(result.status).toBe('error')
    expect(result.checks.some((check) => check.code === 'protectionExceedsConductorCapacity')).toBe(true)
  })

  it('warns instead of validating when ampacity is missing', () => {
    const result = validateProtection({
      designCurrent: 10,
      protectionRating: 16,
      ampacityConfigured: false,
    })
    expect(result.status).toBe('warning')
    expect(result.checks.some((check) => check.code === 'ampacityNotConfigured')).toBe(true)
  })
})

describe('calculateCircuitDesign', () => {
  it('calculates kitchen lighting and keeps ampacity unvalidated on the example rule set', () => {
    const result = calculateCircuitDesign({
      circuit: {
        category: 'lighting',
        loads: kitchenLights,
        installation: { length: 18, systemPhase: 'single-phase' },
      },
      ruleSet: EXAMPLE_ELECTRICAL_RULE_SET,
      calculatedAt: '2026-08-24T00:00:00.000Z',
    })

    expect(result.installedPower).toBe(45)
    expect(result.designPower).toBe(45)
    expect(result.designCurrent).toBeCloseTo(45 / (230 * 1), 2)
    expect(result.protection?.option?.rating).toBe(6)
    expect(result.conductor?.recommendationBasis).toBe('ruleDefault')
    expect(result.warnings).toContain('ampacityNotConfigured')
    expect(result.validation.status).not.toBe('ok')
    expect(result.ruleSetId).toBe('example-default-v1')
    expect(result.ruleSetVersion).toBe('1.0')
  })

  it('flags voltage drop above the configured limit', () => {
    const result = calculateCircuitDesign({
      circuit: {
        category: 'power',
        loads: [{ id: 'p', quantity: 1, unitPower: 6000, powerFactor: 1 }],
        installation: { length: 80, systemPhase: 'single-phase' },
      },
      ruleSet: ruleSetWithAmpacity(),
      calculatedAt: '2026-08-24T00:00:00.000Z',
    })
    expect(result.errors).toContain('voltageDropAboveLimit')
  })
})

describe('quote and cable integration', () => {
  it('maps a recommended 1.5 mm² circuit to CableFlow type I', () => {
    const result = createCableRunFromCircuit({
      id: 'ckt',
      projectId: 'p1',
      name: 'Lights',
      category: 'lighting',
      loads: [],
      installation: { length: 12 },
      createdAt: '2026-08-24T00:00:00.000Z',
      updatedAt: '2026-08-24T00:00:00.000Z',
      design: {
        installedPower: 45,
        designPower: 45,
        designCurrent: 0.2,
        systemPhase: 'single-phase',
        voltage: 230,
        conductor: {
          recommendedSection: 1.5,
          recommendationBasis: 'ruleDefault',
          warnings: [],
          errors: [],
        },
        additionalProtections: [],
        validation: { status: 'warning', checks: [] },
        warnings: [],
        errors: [],
        ruleSetId: 'example-default-v1',
        ruleSetVersion: '1.0',
        calculatedAt: '2026-08-24T00:00:00.000Z',
      },
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.type).toBe('I')
    expect(result.distance).toBe(12)
  })

  it('adds protection quote lines only when a material is selected', () => {
    const items = buildQuoteItemsFromCircuits(
      [{
        id: 'ckt',
        projectId: 'p1',
        name: 'Lights',
        category: 'lighting',
        loads: [],
        selectedProtectionMaterialId: 'mat-mcb',
        createdAt: '2026-08-24T00:00:00.000Z',
        updatedAt: '2026-08-24T00:00:00.000Z',
        design: {
          installedPower: 45,
          designPower: 45,
          designCurrent: 0.2,
          systemPhase: 'single-phase',
          voltage: 230,
          protection: {
            calculated: true,
            validated: false,
            option: { id: 'mcb-6', type: 'MCB', rating: 6, enabled: true },
            warnings: [],
            errors: [],
          },
          additionalProtections: [],
          validation: { status: 'warning', checks: [] },
          warnings: [],
          errors: [],
          ruleSetId: 'example-default-v1',
          ruleSetVersion: '1.0',
          calculatedAt: '2026-08-24T00:00:00.000Z',
        },
      }],
      [{
        id: 'mat-mcb',
        name: 'MCB 6A',
        category: 'breakers',
        unit: 'unit',
        purchasePrice: 8,
        active: true,
        createdAt: '2026-08-24T00:00:00.000Z',
        updatedAt: '2026-08-24T00:00:00.000Z',
      }],
      20,
    )
    expect(items).toHaveLength(1)
    expect(items[0]?.source?.source).toBe('protection')
    expect(items[0]?.description).toBe('MCB 6A')
  })
})
