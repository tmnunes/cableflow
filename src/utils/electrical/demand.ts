import type { CircuitLoad, ElectricalDefaults, ElectricalRuleSet } from '@/types/electrical'
import { loadInstalledPower } from '@/utils/electrical/power'

export interface DemandFactors {
  utilizationFactor: number
  simultaneityFactor: number
  usedDefaultUtilization: boolean
  usedDefaultSimultaneity: boolean
}

export function resolveDemandFactors(
  load: CircuitLoad,
  defaults?: ElectricalDefaults,
): DemandFactors {
  const utilization =
    typeof load.utilizationFactor === 'number' && Number.isFinite(load.utilizationFactor)
      ? load.utilizationFactor
      : defaults?.utilizationFactor
  const simultaneity =
    typeof load.simultaneityFactor === 'number' && Number.isFinite(load.simultaneityFactor)
      ? load.simultaneityFactor
      : defaults?.simultaneityFactor

  return {
    utilizationFactor: utilization ?? 1,
    simultaneityFactor: simultaneity ?? 1,
    usedDefaultUtilization: utilization === undefined,
    usedDefaultSimultaneity: simultaneity === undefined,
  }
}

export function loadDesignPower(load: CircuitLoad, defaults?: ElectricalDefaults): number {
  const factors = resolveDemandFactors(load, defaults)
  return loadInstalledPower(load) * factors.utilizationFactor * factors.simultaneityFactor
}

export function calculateDesignPower(
  loads: CircuitLoad[],
  rules?: Pick<ElectricalRuleSet, 'defaults'> | ElectricalDefaults,
): number {
  const defaults = rules && 'defaults' in rules ? rules.defaults : rules
  return loads.reduce((sum, load) => sum + loadDesignPower(load, defaults), 0)
}

export function weightedPowerFactor(
  loads: CircuitLoad[],
  defaults?: ElectricalDefaults,
): { value?: number; usedFallback: boolean } {
  let weighted = 0
  let total = 0
  let missing = false

  for (const load of loads) {
    const power = loadDesignPower(load, defaults)
    if (power <= 0) continue
    const pf =
      typeof load.powerFactor === 'number' && Number.isFinite(load.powerFactor) && load.powerFactor > 0
        ? load.powerFactor
        : undefined
    if (pf === undefined) {
      missing = true
      continue
    }
    weighted += pf * power
    total += power
  }

  if (total > 0) {
    return { value: weighted / total, usedFallback: missing }
  }

  if (defaults?.powerFactor && defaults.powerFactor > 0) {
    return { value: defaults.powerFactor, usedFallback: true }
  }

  return { value: undefined, usedFallback: true }
}
