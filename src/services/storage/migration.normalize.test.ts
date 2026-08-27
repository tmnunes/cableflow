import { describe, expect, it } from 'vitest'
import { createDefaultAppData } from '@/services/storage/defaultAppData'
import { normalizeAppData } from '@/services/storage/migration'
import { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'
import { calculateCircuitDesign } from '@/utils/electrical/circuitDesign'

describe('normalizeAppData rule upgrades', () => {
  it('upgrades example-default-v1 even when isExample was cleared by rename', () => {
    const base = createDefaultAppData()
    const stale = {
      ...base,
      electricalRuleSets: [
        {
          ...EXAMPLE_ELECTRICAL_RULE_SET,
          version: '1.3',
          isExample: false,
          name: 'My rules',
          circuitRules: EXAMPLE_ELECTRICAL_RULE_SET.circuitRules.map((rule) =>
            rule.circuitCategory === 'kitchen'
              ? { ...rule, protectionOptionIds: ['example-mcb-1p-c16', 'example-mcb-1p-c20'] }
              : rule,
          ),
        },
      ],
      circuits: [
        {
          id: 'hob',
          projectId: base.projects[0]!.id,
          name: 'Hob',
          category: 'kitchen' as const,
          loads: [{ id: 'l1', quantity: 1, unitPower: 10000, powerFactor: 1 }],
          installation: { length: 12, systemPhase: 'three-phase' as const, voltage: 230 },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          design: {
            installedPower: 10000,
            designPower: 10000,
            designCurrent: 25.1,
            systemPhase: 'three-phase' as const,
            voltage: 230,
            protection: {
              calculated: false,
              validated: false,
              warnings: ['noPhaseMatchedProtectionOptions'],
              errors: ['noProtectionCoversDesignCurrent'],
            },
            additionalProtections: [],
            validation: { status: 'error' as const, checks: [] },
            warnings: [],
            errors: ['noProtectionCoversDesignCurrent'],
            ruleSetId: 'example-default-v1',
            ruleSetVersion: '1.3',
            calculatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ],
    }

    const next = normalizeAppData(stale)
    const ruleSet = next.electricalRuleSets[0]!
    expect(ruleSet.version).toBe(EXAMPLE_ELECTRICAL_RULE_SET.version)
    expect(ruleSet.name).toBe('My rules')
    expect(ruleSet.isExample).toBe(false)

    const kitchen = ruleSet.circuitRules.find((rule) => rule.circuitCategory === 'kitchen')
    expect(kitchen?.protectionOptionIds).toContain('example-mcb-3p-c32')

    const circuit = next.circuits.find((item) => item.id === 'hob')!
    expect(circuit.design?.protection?.option?.rating).toBe(32)
    expect(circuit.design?.protection?.option?.poles).toBe(3)
    expect(circuit.design?.errors ?? []).not.toContain('noProtectionCoversDesignCurrent')
  })

  it('recommends 32 A 3P for a 10 kW three-phase kitchen hob on the latest example set', () => {
    const result = calculateCircuitDesign({
      circuit: {
        category: 'kitchen',
        loads: [{ id: 'hob', quantity: 1, unitPower: 10000, powerFactor: 1 }],
        installation: { length: 12, systemPhase: 'three-phase', voltage: 230 },
      },
      ruleSet: EXAMPLE_ELECTRICAL_RULE_SET,
    })
    expect(result.designCurrent).toBeCloseTo(25.1, 1)
    expect(result.protection?.option?.rating).toBe(32)
    expect(result.protection?.option?.poles).toBe(3)
  })
})
