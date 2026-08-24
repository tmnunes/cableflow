import type {
  CircuitRule,
  ElectricalRuleSet,
  ProtectionOption,
  ProtectionRecommendation,
} from '@/types/electrical'

export interface ProtectionSelectionInput {
  designCurrent: number
  sectionMm2?: number
  circuitRule?: CircuitRule
}

export function enabledProtectionOptions(
  rules: ElectricalRuleSet,
  circuitRule?: CircuitRule,
): ProtectionOption[] {
  const allowed = new Set(circuitRule?.protectionOptionIds ?? [])
  return rules.protectionOptions.filter((option) => {
    if (!option.enabled) return false
    if (circuitRule && allowed.size > 0 && !allowed.has(option.id)) return false
    return option.type === 'MCB' || option.type === 'RCBO'
  })
}

export function selectProtection(
  input: ProtectionSelectionInput,
  rules: ElectricalRuleSet,
): ProtectionRecommendation {
  const warnings: string[] = []
  const errors: string[] = []
  const options = enabledProtectionOptions(rules, input.circuitRule)
    .filter((option) => {
      if (input.sectionMm2 && option.compatibleSections?.length) {
        return option.compatibleSections.includes(input.sectionMm2)
      }
      return true
    })
    .sort((a, b) => a.rating - b.rating)

  if (options.length === 0) {
    warnings.push('noProtectionOptionsConfigured')
    return { calculated: false, validated: false, warnings, errors }
  }

  const chosen = options.find((option) => option.rating >= input.designCurrent)
  if (!chosen) {
    errors.push('noProtectionCoversDesignCurrent')
    return { calculated: false, validated: false, warnings, errors }
  }

  return {
    option: chosen,
    calculated: true,
    validated: false,
    warnings,
    errors,
  }
}
