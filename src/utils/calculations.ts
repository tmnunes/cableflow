import type {
  CableRun,
  CircuitType,
  ConductorCode,
  ConductorLength,
  Project,
  ProjectSummary,
  ProjectTotals,
  SectionSummary,
  ZoneCircuitSummary,
  ZoneSummary,
} from '@/types'
import {
  CIRCUIT_TYPE_MAP,
  CIRCUIT_TYPES,
  conductorDistanceFactor,
  conductorPhysicalCount,
} from '@/data/circuits'
import { parseSpec } from '@/utils/parser'

const CIRCUIT_ORDER = CIRCUIT_TYPES.map((c) => c.code)

export function getSectionMm2(type: CableRun['type']): number {
  return CIRCUIT_TYPE_MAP[type]?.sectionMm2 ?? 0
}

/**
 * Conductor meters for a single run:
 * each conductor quantity × distance × distanceFactor (VJ is always ×2).
 */
export function calculateRunConductors(run: CableRun): ConductorLength[] {
  const parsed = parseSpec(run.spec)
  if (!parsed.ok || !Number.isFinite(run.distance) || run.distance <= 0) {
    return []
  }

  return parsed.conductors.map((c) => ({
    code: c.code,
    meters: c.quantity * run.distance * conductorDistanceFactor(c.code),
  }))
}

function runCableMeters(run: CableRun, distance: number): number {
  const parsed = parseSpec(run.spec)
  if (!parsed.ok) return 0
  return parsed.conductors.reduce(
    (sum, c) => sum + c.quantity * distance * conductorDistanceFactor(c.code),
    0,
  )
}

export function calculateProjectSummary(project: Project): ProjectSummary {
  const sectionMap = new Map<number, Map<ConductorCode, number>>()
  /** zone → circuit type → { conduit, cable } */
  const zoneMap = new Map<string, Map<CircuitType, { conduit: number; cable: number }>>()
  let totalConduitLength = 0
  let totalCableLength = 0
  let totalConductors = 0

  for (const run of project.items) {
    const distance =
      Number.isFinite(run.distance) && run.distance > 0 ? run.distance : 0
    totalConduitLength += distance

    const zoneKey = run.description.trim()
    if (!zoneMap.has(zoneKey)) {
      zoneMap.set(zoneKey, new Map())
    }
    const circuitBucket = zoneMap.get(zoneKey)!
    const existing = circuitBucket.get(run.type) ?? { conduit: 0, cable: 0 }
    const cableMeters = runCableMeters(run, distance)
    circuitBucket.set(run.type, {
      conduit: existing.conduit + distance,
      cable: existing.cable + cableMeters,
    })

    const parsed = parseSpec(run.spec)
    if (parsed.ok) {
      for (const c of parsed.conductors) {
        const physical = c.quantity * conductorPhysicalCount(c.code)
        const meters = c.quantity * distance * conductorDistanceFactor(c.code)
        totalConductors += physical
        totalCableLength += meters

        const section = getSectionMm2(run.type)
        if (section <= 0) continue

        if (!sectionMap.has(section)) {
          sectionMap.set(section, new Map())
        }
        const bucket = sectionMap.get(section)!
        bucket.set(c.code, (bucket.get(c.code) ?? 0) + meters)
      }
    }
  }

  const bySection: SectionSummary[] = [...sectionMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sectionMm2, conductors]) => {
      const list: ConductorLength[] = [...conductors.entries()]
        .map(([code, meters]) => ({ code, meters: roundMeters(meters) }))
        .sort((a, b) => a.code.localeCompare(b.code))

      return {
        sectionMm2,
        conductors: list,
        totalMeters: roundMeters(list.reduce((sum, c) => sum + c.meters, 0)),
      }
    })

  const byZone: ZoneSummary[] = [...zoneMap.entries()]
    .map(([description, circuits]) => {
      const byCircuit: ZoneCircuitSummary[] = [...circuits.entries()]
        .map(([type, values]) => ({
          type,
          sectionMm2: getSectionMm2(type),
          conduitMeters: roundMeters(values.conduit),
          cableMeters: roundMeters(values.cable),
        }))
        .sort(
          (a, b) => CIRCUIT_ORDER.indexOf(a.type) - CIRCUIT_ORDER.indexOf(b.type),
        )

      return {
        description,
        conduitMeters: roundMeters(byCircuit.reduce((s, c) => s + c.conduitMeters, 0)),
        cableMeters: roundMeters(byCircuit.reduce((s, c) => s + c.cableMeters, 0)),
        byCircuit,
      }
    })
    .sort((a, b) => {
      const aEmpty = !a.description
      const bEmpty = !b.description
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1
      return a.description.localeCompare(b.description, undefined, { numeric: true })
    })

  const totals: ProjectTotals = {
    totalConduitLength: roundMeters(totalConduitLength),
    totalCableLength: roundMeters(totalCableLength),
    totalConductors,
    cableRuns: project.items.length,
  }

  return { totals, bySection, byZone }
}

function roundMeters(value: number): number {
  return Math.round(value * 100) / 100
}
