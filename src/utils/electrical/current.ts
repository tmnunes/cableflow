import type { ElectricalSystem } from '@/types/electrical'

export interface DesignCurrentInput {
  powerW: number
  voltage: number
  powerFactor?: number
  system: ElectricalSystem
}

export function calculateDesignCurrent(input: DesignCurrentInput): number {
  const { powerW, voltage, powerFactor, system } = input
  if (!Number.isFinite(powerW) || powerW <= 0) return 0
  if (!Number.isFinite(voltage) || voltage <= 0) return Number.NaN
  const pf = powerFactor && powerFactor > 0 ? powerFactor : Number.NaN
  if (!Number.isFinite(pf)) return Number.NaN

  if (system === 'three-phase') {
    return powerW / (Math.sqrt(3) * voltage * pf)
  }
  return powerW / (voltage * pf)
}

export function roundAmperes(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function roundWatts(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
