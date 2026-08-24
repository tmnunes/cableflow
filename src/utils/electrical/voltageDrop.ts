import type { ElectricalSystem } from '@/types/electrical'

export interface VoltageDropInput {
  lengthM?: number
  sectionMm2?: number
  currentA?: number
  resistivityOhmMm2PerM?: number
  reactanceOhmPerKm?: number
  powerFactor?: number
  system: ElectricalSystem
  voltage: number
  limitPercent?: number
}

export function calculateVoltageDrop(input: VoltageDropInput) {
  const warnings: string[] = []
  const errors: string[] = []

  if (
    input.lengthM === undefined ||
    !Number.isFinite(input.lengthM) ||
    input.sectionMm2 === undefined ||
    !Number.isFinite(input.sectionMm2) ||
    input.currentA === undefined ||
    !Number.isFinite(input.currentA) ||
    input.resistivityOhmMm2PerM === undefined ||
    !Number.isFinite(input.resistivityOhmMm2PerM)
  ) {
    warnings.push('voltageDropDataMissing')
    return {
      calculated: false,
      warnings,
      errors,
      limitPercent: input.limitPercent,
    }
  }

  const resistance = (input.resistivityOhmMm2PerM * input.lengthM) / input.sectionMm2
  const reactance =
    input.reactanceOhmPerKm !== undefined && Number.isFinite(input.reactanceOhmPerKm)
      ? (input.reactanceOhmPerKm * input.lengthM) / 1000
      : 0
  const pf = input.powerFactor && input.powerFactor > 0 ? Math.min(input.powerFactor, 1) : 1
  const qf = Math.sqrt(Math.max(0, 1 - pf * pf))
  const impedanceDrop = input.currentA * (resistance * pf + reactance * qf)
  const voltageDrop = input.system === 'three-phase' ? Math.sqrt(3) * impedanceDrop : 2 * impedanceDrop
  const voltageDropPercent = input.voltage > 0 ? (voltageDrop / input.voltage) * 100 : Number.NaN

  if (
    input.limitPercent !== undefined &&
    Number.isFinite(voltageDropPercent) &&
    voltageDropPercent > input.limitPercent
  ) {
    errors.push('voltageDropAboveLimit')
  }

  return {
    calculated: true,
    voltageDrop,
    voltageDropPercent,
    limitPercent: input.limitPercent,
    warnings,
    errors,
  }
}
