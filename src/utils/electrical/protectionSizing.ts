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
  /** When set, options with matching poles are preferred before falling back. */
  systemPhase?: 'single-phase' | 'three-phase'
}

function polesMatchSystem(option: ProtectionOption, systemPhase?: 'single-phase' | 'three-phase'): boolean {
  if (!systemPhase) return true
  if (systemPhase === 'three-phase') return option.poles === 3 || option.poles === 4
  return option.poles === 1 || option.poles === 2
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
    .sort((a, b) => a.rating - b.rating || (a.poles ?? 0) - (b.poles ?? 0))

  if (options.length === 0) {
    warnings.push('noProtectionOptionsConfigured')
    return { calculated: false, validated: false, warnings, errors }
  }

  const phaseMatched = options.filter((option) => polesMatchSystem(option, input.systemPhase))
  const pool = phaseMatched.length > 0 ? phaseMatched : options
  if (input.systemPhase && phaseMatched.length === 0) {
    warnings.push('noPhaseMatchedProtectionOptions')
  }

  const chosen = pool.find((option) => option.rating >= input.designCurrent)
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
