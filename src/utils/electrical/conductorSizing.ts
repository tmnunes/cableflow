import type {
  ConductorMaterial,
  ConductorRule,
  ConductorSizingResult,
  ElectricalRuleSet,
} from '@/types/electrical'
import { calculateVoltageDrop } from '@/utils/electrical/voltageDrop'
import type { ElectricalSystem } from '@/types/electrical'

export interface ConductorSizingInput {
  designCurrent: number
  protectionRating?: number
  allowedSections: number[]
  defaultSection?: number
  conductorMaterial: ConductorMaterial
  installationMethodId?: string
  loadedConductors?: number
  lengthM?: number
  voltage: number
  system: ElectricalSystem
  powerFactor?: number
  maxVoltageDropPercent?: number
}

export function findAmpacityRule(
  rules: ElectricalRuleSet,
  material: ConductorMaterial,
  installationMethodId?: string,
): ConductorRule | undefined {
  return rules.conductorRules.find((rule) => {
    if (rule.conductorMaterial !== material) return false
    if (installationMethodId && rule.installationMethodId) {
      return rule.installationMethodId === installationMethodId
    }
    return true
  })
}

export function selectConductorSection(
  input: ConductorSizingInput,
  rules: ElectricalRuleSet,
): ConductorSizingResult {
  const warnings: string[] = []
  const errors: string[] = []
  const available = input.allowedSections.length
    ? input.allowedSections
    : rules.defaults.availableSectionsMm2
  const ampacityRule = findAmpacityRule(
    rules,
    input.conductorMaterial,
    input.installationMethodId,
  )
  const table = ampacityRule?.ampacityBySection ?? []
  const referenceCurrent = input.protectionRating ?? input.designCurrent

  if (table.length === 0) {
    warnings.push('ampacityNotConfigured')
    const fallback = input.defaultSection
    const voltageDrop = fallback
      ? calculateVoltageDrop({
          lengthM: input.lengthM,
          sectionMm2: fallback,
          currentA: input.designCurrent,
          resistivityOhmMm2PerM: rules.defaults.conductorResistivityOhmMm2PerM,
          reactanceOhmPerKm: rules.defaults.conductorReactanceOhmPerKm,
          powerFactor: input.powerFactor,
          system: input.system,
          voltage: input.voltage,
          limitPercent: input.maxVoltageDropPercent ?? rules.defaults.maxVoltageDropPercent,
        })
      : undefined
    warnings.push(...(voltageDrop?.warnings ?? []))
    errors.push(...(voltageDrop?.errors ?? []))
    return {
      recommendedSection: fallback,
      alternatives: [],
      recommendationBasis: fallback ? 'ruleDefault' : 'none',
      voltageDrop: voltageDrop?.voltageDrop,
      voltageDropPercent: voltageDrop?.voltageDropPercent,
      warnings,
      errors,
    }
  }

  const matching = available
    .map((section) => ({
      section,
      currentCapacity: table.find((row) => row.sectionMm2 === section)?.currentA,
    }))
    .filter((row) => typeof row.currentCapacity === 'number')
    .sort((a, b) => a.section - b.section)

  const suitable = matching.filter(
    (row) => (row.currentCapacity ?? 0) >= referenceCurrent,
  )
  const chosen = suitable[0] ?? matching[matching.length - 1]

  if (!chosen) {
    errors.push('noSuitableConductorSection')
    return {
      recommendationBasis: 'none',
      warnings,
      errors,
    }
  }

  if (!suitable.length) {
    errors.push('conductorBelowRequiredCurrent')
  }

  const voltageDrop = calculateVoltageDrop({
    lengthM: input.lengthM,
    sectionMm2: chosen.section,
    currentA: input.designCurrent,
    resistivityOhmMm2PerM: rules.defaults.conductorResistivityOhmMm2PerM,
    reactanceOhmPerKm: rules.defaults.conductorReactanceOhmPerKm,
    powerFactor: input.powerFactor,
    system: input.system,
    voltage: input.voltage,
    limitPercent: input.maxVoltageDropPercent ?? rules.defaults.maxVoltageDropPercent,
  })
  warnings.push(...voltageDrop.warnings)
  errors.push(...voltageDrop.errors)

  return {
    recommendedSection: chosen.section,
    alternatives: suitable.slice(1, 4).map((row) => row.section),
    currentCapacity: chosen.currentCapacity,
    voltageDrop: voltageDrop.voltageDrop,
    voltageDropPercent: voltageDrop.voltageDropPercent,
    recommendationBasis: 'ampacity',
    warnings,
    errors,
  }
}
