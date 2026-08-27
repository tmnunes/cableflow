import { describe, expect, it } from 'vitest'
import type { Material, ProjectMaterialItem, ProjectSummary } from '@/types'
import { cableMaterialSourceKey } from '@/types'
import {
  buildCableMaterials,
  materialsSyncFingerprint,
} from '@/utils/cable/projectMaterials'

const tFn = (key: string, opts?: Record<string, unknown>) =>
  key === 'projectMaterials.cableAutoDescription'
    ? `${opts?.section}mm ${opts?.conductor}`
    : key

function summaryWithMeters(meters: number): ProjectSummary {
  return {
    bySection: [
      {
        sectionMm2: 1.5,
        totalMeters: meters,
        conductors: [{ code: 'F', meters }],
      },
    ],
    byZone: [],
    totals: {
      totalConduitLength: meters,
      totalCableLength: meters,
      totalConductors: 1,
      cableRuns: 1,
    },
  }
}

const rollCatalog: Material = {
  id: 'mat-roll-100',
  code: '1.5F',
  name: 'Cable 1.5 F 100m roll',
  category: 'cables',
  unit: 'roll',
  purchasePrice: 40,
  metersPerRoll: 100,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('buildCableMaterials roll resync', () => {
  it('recalculates whole rolls when cable metres increase (190 → 250)', () => {
    const key = cableMaterialSourceKey(1.5, 'F')
    const existing: ProjectMaterialItem[] = [
      {
        id: 'row-1',
        description: '1.5mm Phase (F)',
        quantity: 2,
        unit: 'roll',
        unitPrice: 40,
        notes: '',
        cableSourceKey: key,
        catalogMaterialId: rollCatalog.id,
        requiredMeters: 190,
      },
    ]

    const at190 = buildCableMaterials(summaryWithMeters(190), existing, [rollCatalog], tFn)
    expect(at190[0]?.quantity).toBe(2)
    expect(at190[0]?.requiredMeters).toBe(190)

    const at250 = buildCableMaterials(summaryWithMeters(250), existing, [rollCatalog], tFn)
    expect(at250[0]?.quantity).toBe(3)
    expect(at250[0]?.unit).toBe('roll')
    expect(at250[0]?.requiredMeters).toBe(250)
    expect(at250[0]?.unitPrice).toBe(40)

    expect(materialsSyncFingerprint(at190)).not.toBe(materialsSyncFingerprint(at250))
  })

  it('keeps manual (non-auto) rows untouched', () => {
    const key = cableMaterialSourceKey(1.5, 'F')
    const existing: ProjectMaterialItem[] = [
      {
        id: 'auto-1',
        description: 'cable',
        quantity: 2,
        unit: 'roll',
        unitPrice: 40,
        notes: '',
        cableSourceKey: key,
        catalogMaterialId: rollCatalog.id,
        requiredMeters: 190,
      },
      {
        id: 'manual-1',
        description: 'Junction box',
        quantity: 4,
        unit: 'unit',
        unitPrice: 2,
        notes: '',
      },
    ]

    const next = buildCableMaterials(summaryWithMeters(250), existing, [rollCatalog], tFn)
    expect(next).toHaveLength(2)
    expect(next.find((m) => m.id === 'manual-1')?.quantity).toBe(4)
    expect(next.find((m) => m.cableSourceKey === key)?.quantity).toBe(3)
  })
})
