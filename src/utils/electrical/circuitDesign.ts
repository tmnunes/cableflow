import type {
  Circuit,
  CircuitCategory,
  CircuitDesignResult,
  CircuitLoad,
  CircuitRule,
  ElectricalRuleSet,
  ElectricalSystem,
  InstallationParameters,
  LoadType,
  ValidationStatus,
} from '@/types/electrical'
import { calculateDesignPower, resolveDemandFactors, weightedPowerFactor } from '@/utils/electrical/demand'
import { calculateDesignCurrent, roundAmperes, roundWatts } from '@/utils/electrical/current'
import { calculateInstalledPower } from '@/utils/electrical/power'
import { selectConductorSection } from '@/utils/electrical/conductorSizing'
import { selectProtection } from '@/utils/electrical/protectionSizing'
import {
  additionalProtectionsFromRules,
  validateProtection,
  worstStatus,
} from '@/utils/electrical/validation'

export interface CircuitDesignInput {
  circuit: Pick<Circuit, 'category' | 'loads' | 'installation'>
  ruleSet: ElectricalRuleSet
  loadTypes?: LoadType[]
  calculatedAt?: string
}

export function findCircuitRule(
  ruleSet: ElectricalRuleSet,
  category: CircuitCategory,
): CircuitRule | undefined {
  return (
    ruleSet.circuitRules.find((rule) => rule.circuitCategory === category) ??
    ruleSet.circuitRules.find((rule) => rule.circuitCategory === 'other')
  )
}

export function hydrateLoads(loads: CircuitLoad[], loadTypes: LoadType[] = []): CircuitLoad[] {
  const catalog = new Map(loadTypes.map((item) => [item.id, item]))
  return loads.map((load) => {
    const type = load.loadTypeId ? catalog.get(load.loadTypeId) : undefined
    if (!type) return load
    return {
      ...load,
      description: load.description ?? type.name,
      unitPower: Number.isFinite(load.unitPower) ? load.unitPower : type.defaultUnitPower,
      powerFactor: load.powerFactor ?? type.defaultPowerFactor,
      utilizationFactor: load.utilizationFactor ?? type.defaultUtilizationFactor,
      simultaneityFactor: load.simultaneityFactor ?? type.defaultSimultaneityFactor,
    }
  })
}

export function resolveInstallation(
  installation: InstallationParameters | undefined,
  ruleSet: ElectricalRuleSet,
): {
  system: ElectricalSystem
  voltage: number
  conductorMaterial: InstallationParameters['conductorMaterial']
  installationMethodId?: string
  length?: number
  maxVoltageDropPercent?: number
} {
  return {
    system: installation?.systemPhase ?? ruleSet.defaults.systemPhase,
    voltage: installation?.voltage ?? ruleSet.voltage ?? ruleSet.defaults.voltage,
    conductorMaterial: installation?.conductorMaterial ?? ruleSet.defaults.conductorMaterial,
    installationMethodId: installation?.installationMethodId,
    length: installation?.length,
    maxVoltageDropPercent:
      installation?.maxVoltageDropPercent ??
      findCircuitRule(ruleSet, 'other')?.maxVoltageDropPercent ??
      ruleSet.defaults.maxVoltageDropPercent,
  }
}

export function calculateCircuitDesign(input: CircuitDesignInput): CircuitDesignResult {
  const { ruleSet } = input
  const loads = hydrateLoads(input.circuit.loads, input.loadTypes)
  const circuitRule = findCircuitRule(ruleSet, input.circuit.category)
  const installation = resolveInstallation(input.circuit.installation, ruleSet)
  const warnings: string[] = []
  const errors: string[] = []

  if (ruleSet.isExample) {
    warnings.push('exampleRuleSetInUse')
  }
  if (!circuitRule) {
    warnings.push('noCircuitRuleConfigured')
  }

  const installedPower = roundWatts(calculateInstalledPower(loads))
  const designPower = roundWatts(calculateDesignPower(loads, ruleSet.defaults))
  const pf = weightedPowerFactor(loads, ruleSet.defaults)
  if (pf.usedFallback) warnings.push('powerFactorFallback')
  if (!pf.value) errors.push('powerFactorMissing')

  for (const load of loads) {
    const factors = resolveDemandFactors(load, ruleSet.defaults)
    if (factors.usedDefaultUtilization) warnings.push('utilizationFactorFallback')
    if (factors.usedDefaultSimultaneity) warnings.push('simultaneityFactorFallback')
  }

  const designCurrent = roundAmperes(
    calculateDesignCurrent({
      powerW: designPower,
      voltage: installation.voltage,
      powerFactor: pf.value,
      system: installation.system,
    }),
  )
  if (!Number.isFinite(designCurrent)) {
    errors.push('designCurrentNotCalculable')
  }

  const conductor = Number.isFinite(designCurrent)
    ? selectConductorSection(
        {
          designCurrent,
          allowedSections: circuitRule?.allowedConductorSections ?? ruleSet.defaults.availableSectionsMm2,
          defaultSection: circuitRule?.defaultConductorSection,
          conductorMaterial: installation.conductorMaterial ?? 'copper',
          installationMethodId: installation.installationMethodId,
          loadedConductors: input.circuit.installation?.loadedConductors,
          lengthM: installation.length,
          voltage: installation.voltage,
          system: installation.system,
          powerFactor: pf.value,
          maxVoltageDropPercent:
            circuitRule?.maxVoltageDropPercent ?? installation.maxVoltageDropPercent,
        },
        ruleSet,
      )
    : undefined

  if (conductor) {
    warnings.push(...conductor.warnings)
    errors.push(...conductor.errors)
  }

  const protection = Number.isFinite(designCurrent)
    ? selectProtection(
        {
          designCurrent,
          sectionMm2: conductor?.recommendedSection,
          circuitRule,
        },
        ruleSet,
      )
    : undefined

  if (protection) {
    warnings.push(...protection.warnings)
    errors.push(...protection.errors)
  }

  if (
    conductor?.recommendedSection !== undefined &&
    Number.isFinite(designCurrent)
  ) {
    const refined = selectConductorSection(
      {
        designCurrent,
        protectionRating: protection?.option?.rating,
        allowedSections: circuitRule?.allowedConductorSections ?? ruleSet.defaults.availableSectionsMm2,
        defaultSection: circuitRule?.defaultConductorSection,
        conductorMaterial: installation.conductorMaterial ?? 'copper',
        installationMethodId: installation.installationMethodId,
        loadedConductors: input.circuit.installation?.loadedConductors,
        lengthM: installation.length,
        voltage: installation.voltage,
        system: installation.system,
        powerFactor: pf.value,
        maxVoltageDropPercent:
          circuitRule?.maxVoltageDropPercent ?? installation.maxVoltageDropPercent,
      },
      ruleSet,
    )
    conductor.recommendedSection = refined.recommendedSection
    conductor.alternatives = refined.alternatives
    conductor.currentCapacity = refined.currentCapacity
    conductor.voltageDrop = refined.voltageDrop
    conductor.voltageDropPercent = refined.voltageDropPercent
    conductor.recommendationBasis = refined.recommendationBasis
    conductor.warnings = refined.warnings
    conductor.errors = refined.errors
    warnings.push(...refined.warnings.filter((code) => !warnings.includes(code)))
    errors.push(...refined.errors.filter((code) => !errors.includes(code)))
  }

  const coordination = validateProtection({
    designCurrent: Number.isFinite(designCurrent) ? designCurrent : undefined,
    protectionRating: protection?.option?.rating,
    conductorCapacity: conductor?.currentCapacity,
    ampacityConfigured: conductor?.recommendationBasis === 'ampacity',
  })

  if (protection) {
    protection.validated = coordination.status === 'ok'
  }

  const additionalProtections = additionalProtectionsFromRules(
    ruleSet.additionalProtectionRules,
    input.circuit.category,
  )

  const uniqueWarnings = [...new Set(warnings)]
  const uniqueErrors = [...new Set(errors)]
  const status = worstStatus([
    coordination.status,
    uniqueErrors.length ? 'error' : uniqueWarnings.length ? 'warning' : 'ok',
  ]) as ValidationStatus

  return {
    installedPower,
    designPower,
    designCurrent: Number.isFinite(designCurrent) ? designCurrent : 0,
    powerFactor: pf.value,
    systemPhase: installation.system,
    voltage: installation.voltage,
    conductor,
    protection,
    additionalProtections,
    validation: {
      status,
      checks: coordination.checks,
    },
    warnings: uniqueWarnings,
    errors: uniqueErrors,
    ruleSetId: ruleSet.id,
    ruleSetVersion: ruleSet.version,
    calculatedAt: input.calculatedAt ?? new Date().toISOString(),
  }
}
