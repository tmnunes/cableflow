import { describe, expect, it } from 'vitest'
import { createDefaultProtectionMaterials } from '@/data/electrical/exampleProtectionMaterials'
import { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'

describe('example protection materials', () => {
  it('seeds EFAPEL panel references linked to rule-set protection options', () => {
    const materials = createDefaultProtectionMaterials('2026-08-24T00:00:00.000Z')
    expect(materials.length).toBe(14)
    expect(materials.some((item) => item.code === '55110 3CP' && item.category === 'breakers')).toBe(true)
    expect(materials.some((item) => item.code === '55640 4BC' && item.category === 'rcd')).toBe(true)
    expect(materials.some((item) => item.model === 'Pro 3EM')).toBe(true)

    const linked = EXAMPLE_ELECTRICAL_RULE_SET.protectionOptions.filter((option) => option.materialId)
    expect(linked.length).toBe(EXAMPLE_ELECTRICAL_RULE_SET.protectionOptions.length)
    for (const option of linked) {
      expect(materials.some((material) => material.id === option.materialId)).toBe(true)
    }
  })
})
