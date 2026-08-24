import type { CircuitLoad } from '@/types/electrical'

export function loadInstalledPower(load: CircuitLoad): number {
  const quantity = Number.isFinite(load.quantity) ? load.quantity : 0
  const unitPower = Number.isFinite(load.unitPower) ? load.unitPower : 0
  return quantity * unitPower
}

export function calculateInstalledPower(loads: CircuitLoad[]): number {
  return loads.reduce((sum, load) => sum + loadInstalledPower(load), 0)
}
