import type {
  CableRun,
  ConductorCode,
  ConductorLength,
  Project,
  ProjectSummary,
  ProjectTotals,
  SectionSummary,
} from '@/types'
import { CIRCUIT_TYPE_MAP } from '@/data/circuits'
import { parseSpec } from '@/utils/parser'

export function getSectionMm2(type: CableRun['type']): number {
  return CIRCUIT_TYPE_MAP[type]?.sectionMm2 ?? 0
}

/**
 * Conductor meters for a single run:
 * each conductor quantity × distance.
 */
export function calculateRunConductors(run: CableRun): ConductorLength[] {
  const parsed = parseSpec(run.spec)
  if (!parsed.ok || !Number.isFinite(run.distance) || run.distance <= 0) {
    return []
  }

  return parsed.conductors.map((c) => ({
    code: c.code,
    meters: c.quantity * run.distance,
  }))
}

export function calculateProjectSummary(project: Project): ProjectSummary {
  const sectionMap = new Map<number, Map<ConductorCode, number>>()
  let totalConduitLength = 0
  let totalCableLength = 0
  let totalConductors = 0

  for (const run of project.items) {
    const distance =
      Number.isFinite(run.distance) && run.distance > 0 ? run.distance : 0
    totalConduitLength += distance

    const parsed = parseSpec(run.spec)
    if (parsed.ok) {
      for (const c of parsed.conductors) {
        totalConductors += c.quantity
        totalCableLength += c.quantity * distance

        const section = getSectionMm2(run.type)
        if (section <= 0) continue

        if (!sectionMap.has(section)) {
          sectionMap.set(section, new Map())
        }
        const bucket = sectionMap.get(section)!
        bucket.set(c.code, (bucket.get(c.code) ?? 0) + c.quantity * distance)
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

  const totals: ProjectTotals = {
    totalConduitLength: roundMeters(totalConduitLength),
    totalCableLength: roundMeters(totalCableLength),
    totalConductors,
    cableRuns: project.items.length,
  }

  return { totals, bySection }
}

function roundMeters(value: number): number {
  return Math.round(value * 100) / 100
}
