import type { LoadType } from '@/types/electrical'
import { EXAMPLE_LOAD_TYPES } from '@/data/electrical/exampleLoadTypes'
import { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'

function nowIso(): string {
  return new Date().toISOString()
}

export function createDefaultLoadTypes(timestamp = nowIso()): LoadType[] {
  return EXAMPLE_LOAD_TYPES.map((item) => ({
    ...item,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

export function createDefaultElectricalRuleSets(timestamp = nowIso()) {
  return [
    {
      ...EXAMPLE_ELECTRICAL_RULE_SET,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

export { EXAMPLE_LOAD_TYPES } from '@/data/electrical/exampleLoadTypes'
export { EXAMPLE_ELECTRICAL_RULE_SET } from '@/data/electrical/exampleRuleSet'
export {
  createDefaultProtectionMaterials,
  EXAMPLE_PROTECTION_MATERIAL_IDS,
} from '@/data/electrical/exampleProtectionMaterials'
