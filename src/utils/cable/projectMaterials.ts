import type { ConductorCode, Material, ProjectMaterialItem, ProjectSummary } from '@/types'
import { cableMaterialSourceKey } from '@/types'
import { catalogPriceForLine, purchaseFromRollCatalog } from '@/utils/pricing/catalogLine'

const CONDUCTOR_LABELS: Record<ConductorCode, string> = {
  F: 'Phase (F)',
  R: 'Return (R)',
  VJ: 'Traveller (VJ)',
  N: 'Neutral (N)',
  T: 'Earth (T)',
  C: 'Multicore 3-core (C)',
}

export function autoCableMaterialId(cableSourceKey: string): string {
  return `auto:${cableSourceKey}`
}

export function materialSyncKey(item: ProjectMaterialItem): string {
  return [
    item.cableSourceKey ?? '',
    item.id,
    item.quantity,
    item.unit,
    item.unitPrice,
    item.requiredMeters ?? '',
    item.catalogMaterialId ?? '',
  ].join('|')
}

export function materialsSyncFingerprint(items: ProjectMaterialItem[]): string {
  return items.map(materialSyncKey).join(';')
}

/**
 * Rebuild project material lines from the live cable summary.
 * Auto cable rows always take quantity / requiredMeters from current metres
 * (and whole-roll purchase when a roll catalog material is linked).
 * Manual rows (no cableSourceKey) are preserved as-is.
 */
export function buildCableMaterials(
  summary: ProjectSummary,
  existing: ProjectMaterialItem[],
  catalogMaterials: Material[],
  tFn: (key: string, opts?: Record<string, unknown>) => string,
): ProjectMaterialItem[] {
  const byKey = new Map(
    existing.filter((m) => m.cableSourceKey).map((m) => [m.cableSourceKey!, m]),
  )
  const cableItems: ProjectMaterialItem[] = []

  for (const section of summary.bySection) {
    for (const cond of section.conductors) {
      const key = cableMaterialSourceKey(section.sectionMm2, cond.code)
      const prev = byKey.get(key)
      const catalog = prev?.catalogMaterialId
        ? catalogMaterials.find((m) => m.id === prev.catalogMaterialId)
        : undefined
      const rollPurchase = catalog ? purchaseFromRollCatalog(cond.meters, catalog) : null
      const id = prev?.id ?? autoCableMaterialId(key)

      if (prev) {
        if (rollPurchase) {
          cableItems.push({
            ...prev,
            id,
            quantity: rollPurchase.quantity,
            unit: rollPurchase.unit,
            unitPrice: rollPurchase.unitPrice,
            requiredMeters: cond.meters,
          })
        } else {
          cableItems.push({
            ...prev,
            id,
            quantity: cond.meters,
            unit: 'meter',
            unitPrice:
              catalog && prev.unit === 'roll'
                ? catalogPriceForLine(catalog, 'meter')
                : prev.unitPrice,
            requiredMeters: cond.meters,
          })
        }
        continue
      }

      const label = CONDUCTOR_LABELS[cond.code] ?? cond.code
      cableItems.push({
        id,
        description: tFn('projectMaterials.cableAutoDescription', {
          section: section.sectionMm2,
          conductor: label,
        }),
        quantity: cond.meters,
        unit: 'meter',
        unitPrice: 0,
        notes: '',
        cableSourceKey: key,
        requiredMeters: cond.meters,
      })
    }
  }

  const manualItems = existing.filter((m) => !m.cableSourceKey)
  return [...cableItems, ...manualItems]
}
