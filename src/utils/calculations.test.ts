import { describe, expect, it } from 'vitest'
import { calculateProjectSummary, calculateRunConductors } from '@/utils/calculations'
import { countConductors, parseSpec } from '@/utils/parser'
import type { Project } from '@/types'

describe('parseSpec', () => {
  it('parses C as multicore cable', () => {
    const result = parseSpec('C')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.conductors).toEqual([{ code: 'C', quantity: 1 }])
    expect(countConductors(result.conductors)).toBe(3)
  })

  it('counts 2C as six physical conductors for conduit matching', () => {
    const result = parseSpec('2C')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(countConductors(result.conductors)).toBe(6)
  })
})

describe('VJ distance factor', () => {
  it('counts VJ metres as quantity × distance × 2', () => {
    const meters = calculateRunConductors({
      id: '1',
      description: 'Stair',
      distance: 8,
      type: 'I',
      conduit: 4,
      spec: '2VJTN',
      notes: '',
    })
    expect(meters.find((c) => c.code === 'VJ')?.meters).toBe(32)
    expect(meters.find((c) => c.code === 'T')?.meters).toBe(8)
    expect(meters.find((c) => c.code === 'N')?.meters).toBe(8)
  })

  it('aggregates project VJ totals with the ×2 factor', () => {
    const project: Project = {
      projectName: 'Test',
      version: 1,
      items: [
        {
          id: '1',
          description: 'Spare',
          distance: 25,
          type: 'G',
          conduit: 4,
          spec: '4VJ',
          notes: '',
        },
      ],
    }
    const summary = calculateProjectSummary(project)
    expect(summary.bySection[0]?.conductors.find((c) => c.code === 'VJ')?.meters).toBe(200)
    expect(summary.totals.totalCableLength).toBe(200)
  })
})

describe('circuit type S', () => {
  it('uses 6 mm² for type S', () => {
    const summary = calculateProjectSummary({
      projectName: 'Test',
      version: 1,
      items: [
        {
          id: '1',
          description: 'Cooker',
          distance: 10,
          type: 'S',
          conduit: 3,
          spec: 'FTN',
          notes: '',
        },
      ],
    })
    expect(summary.bySection[0]?.sectionMm2).toBe(6)
    expect(summary.bySection[0]?.totalMeters).toBe(30)
  })
})

describe('multicore C length', () => {
  it('counts C cable metres as quantity × distance (not ×3)', () => {
    const meters = calculateRunConductors({
      id: '1',
      description: 'Feed',
      distance: 12,
      type: 'T',
      conduit: 3,
      spec: 'C',
      notes: '',
    })
    expect(meters).toEqual([{ code: 'C', meters: 12 }])
  })
})

describe('byZone summary', () => {
  it('aggregates cable and conduit metres by description and circuit type', () => {
    const summary = calculateProjectSummary({
      projectName: 'Test',
      version: 1,
      items: [
        {
          id: '1',
          description: 'Hall Baixo',
          distance: 6,
          type: 'I',
          conduit: 2,
          spec: 'VJR',
          notes: '',
        },
        {
          id: '2',
          description: 'Hall Baixo',
          distance: 2,
          type: 'I',
          conduit: 3,
          spec: 'C',
          notes: '',
        },
        {
          id: '3',
          description: 'Cave',
          distance: 10,
          type: 'T',
          conduit: 3,
          spec: 'FNT',
          notes: '',
        },
        {
          id: '4',
          description: 'Cave',
          distance: 5,
          type: 'I',
          conduit: 3,
          spec: 'FNT',
          notes: '',
        },
      ],
    })

    expect(summary.byZone).toHaveLength(2)

    const hall = summary.byZone.find((z) => z.description === 'Hall Baixo')
    expect(hall?.conduitMeters).toBe(8)
    // VJR: VJ×2×6 + R×6 = 12+6=18; C: 2 → 20 cable metres
    expect(hall?.cableMeters).toBe(20)
    expect(hall?.byCircuit).toEqual([
      { type: 'I', sectionMm2: 1.5, conduitMeters: 8, cableMeters: 20 },
    ])

    const cave = summary.byZone.find((z) => z.description === 'Cave')
    expect(cave?.byCircuit.map((c) => c.type)).toEqual(['I', 'T'])
    expect(cave?.byCircuit.find((c) => c.type === 'T')?.cableMeters).toBe(30)
    expect(cave?.byCircuit.find((c) => c.type === 'I')?.cableMeters).toBe(15)
    expect(cave?.conduitMeters).toBe(15)
    expect(cave?.cableMeters).toBe(45)
  })
})
