import { describe, expect, it } from 'vitest'
import type { ProjectRecord } from '@/types/cable'
import { aggregateCableRequirements } from '@/utils/cable/quoteImport'

describe('aggregateCableRequirements', () => {
  it('sums meters by section × conductor across runs', () => {
    const project: ProjectRecord = {
      id: 'p1',
      projectName: 'Test',
      version: 1,
      createdAt: '',
      updatedAt: '',
      items: [
        {
          id: 'r1',
          description: 'Cozinha',
          distance: 10,
          type: 'T',
          conduit: 3,
          spec: 'FTN',
          notes: '',
        },
        {
          id: 'r2',
          description: 'WC',
          distance: 5,
          type: 'T',
          conduit: 3,
          spec: 'FTN',
          notes: '',
        },
        {
          id: 'r3',
          description: 'Garagem',
          distance: 8,
          type: 'T',
          conduit: 3,
          spec: 'FTN',
          notes: '',
        },
      ],
    }

    const aggregated = aggregateCableRequirements(project)

    // FTN @ 2.5mm² (type T): F=23m, T=23m, N=23m
    const f = aggregated.find((r) => r.conductorCode === 'F' && r.sectionMm2 === 2.5)
    expect(f).toBeDefined()
    expect(f!.meters).toBe(23)
    expect(f!.runCount).toBe(3)

    // 3 conductor types × 1 section = 3 lines, not 9 (3 runs × 3 conductors)
    expect(aggregated).toHaveLength(3)
  })
})
