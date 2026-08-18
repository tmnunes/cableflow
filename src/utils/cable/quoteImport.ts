import type { ProjectMaterialItem, ProjectRecord } from '@/types/cable'
import { parseCableMaterialSourceKey } from '@/types/cable'
import type { ConductorCode } from '@/types/cable'
import type { Material } from '@/types/material'
import type {
  AggregatedCableRequirement,
  CableRequirement,
  Quote,
  QuoteItem,
} from '@/types/quote'
import { cableAggregateKey } from '@/types/quote'
import { getSectionMm2, calculateRunConductors } from '@/utils/calculations'
import { roundMoney } from '@/utils/money'
import { calculateMarginPrice } from '@/utils/pricing'
import { catalogPriceForLine } from '@/utils/pricing/catalogLine'
import { recalculateQuoteItem } from '@/utils/quotes'
import { createId } from '@/utils/cn'

/**
 * Extract per-run conductor requirements from a CableFlow project.
 * Does not modify parser or calculation logic.
 */
export function extractCableRequirements(project: ProjectRecord): CableRequirement[] {
  const requirements: CableRequirement[] = []

  for (const run of project.items) {
    const sectionMm2 = getSectionMm2(run.type)
    const conductors = calculateRunConductors(run)

    for (const conductor of conductors) {
      if (conductor.meters <= 0) continue
      requirements.push({
        key: `${run.id}:${conductor.code}`,
        projectId: project.id,
        runId: run.id,
        runDescription: run.description,
        circuitType: run.type,
        sectionMm2,
        conductorCode: conductor.code,
        meters: roundMoney(conductor.meters),
      })
    }
  }

  return requirements
}

/**
 * Sum cable needs by section × conductor (ignores circuit descriptions).
 * Example: all F @ 2.5 mm² across cozinha, wc, garagem → one line.
 */
export function aggregateCableRequirements(
  project: ProjectRecord,
): AggregatedCableRequirement[] {
  const map = new Map<string, AggregatedCableRequirement>()

  for (const req of extractCableRequirements(project)) {
    const key = cableAggregateKey(req.sectionMm2, req.conductorCode)
    const existing = map.get(key)
    if (existing) {
      existing.meters = roundMoney(existing.meters + req.meters)
      existing.runCount += 1
    } else {
      map.set(key, {
        key,
        projectId: req.projectId,
        sectionMm2: req.sectionMm2,
        conductorCode: req.conductorCode,
        meters: req.meters,
        runCount: 1,
      })
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.sectionMm2 !== b.sectionMm2) return a.sectionMm2 - b.sectionMm2
    return a.conductorCode.localeCompare(b.conductorCode)
  })
}

export interface ConductorMaterialSelection {
  requirementKey: string
  materialId: string
}

/** Build quote line items from aggregated cable requirements + material selections */
export function buildQuoteItemsFromAggregatedMapping(
  requirements: AggregatedCableRequirement[],
  selections: ConductorMaterialSelection[],
  materials: Material[],
  defaultMarginPercent: number,
): QuoteItem[] {
  const selectionMap = new Map(selections.map((s) => [s.requirementKey, s.materialId]))
  const materialMap = new Map(materials.map((m) => [m.id, m]))
  const items: QuoteItem[] = []

  for (const req of requirements) {
    const materialId = selectionMap.get(req.key)
    if (!materialId) continue

    const material = materialMap.get(materialId)
    if (!material) continue

    const purchaseUnitPrice = catalogPriceForLine(material, 'meter')
    const saleUnitPrice =
      material.salePrice && material.unit !== 'roll'
        ? material.salePrice
        : calculateMarginPrice(purchaseUnitPrice, defaultMarginPercent)

    items.push(
      recalculateQuoteItem({
        id: createId(),
        materialId: material.id,
        description: `${material.name} (${req.conductorCode}, ${req.sectionMm2} mm²)`,
        category: material.category,
        quantity: req.meters,
        unit: 'meter',
        purchaseUnitPrice,
        saleUnitPrice,
        purchaseTotal: 0,
        saleTotal: 0,
        source: {
          source: 'cableflow',
          projectId: req.projectId,
          conductorCode: req.conductorCode,
          sectionMm2: req.sectionMm2,
          aggregated: true,
        },
      }),
    )
  }

  return items
}

function aggregateFromGranular(
  requirements: CableRequirement[],
): AggregatedCableRequirement[] {
  const map = new Map<string, AggregatedCableRequirement>()
  for (const req of requirements) {
    const key = cableAggregateKey(req.sectionMm2, req.conductorCode)
    const existing = map.get(key)
    if (existing) {
      existing.meters = roundMoney(existing.meters + req.meters)
      existing.runCount += 1
    } else {
      map.set(key, {
        key,
        projectId: req.projectId,
        sectionMm2: req.sectionMm2,
        conductorCode: req.conductorCode,
        meters: req.meters,
        runCount: 1,
      })
    }
  }
  return [...map.values()]
}

/** Compare aggregated project totals with quote cable lines */
export interface CableQuantityDiff {
  requirementKey: string
  conductorCode: ConductorCode
  sectionMm2: number
  currentMeters: number
  quotedMeters: number
  delta: number
}

function itemAggregateKey(item: QuoteItem): string | null {
  if (item.source?.source !== 'cableflow') return null
  if (item.source.conductorCode === undefined || item.source.sectionMm2 === undefined) {
    return null
  }
  return cableAggregateKey(item.source.sectionMm2, item.source.conductorCode)
}

export function diffAggregatedCableQuantities(
  requirements: AggregatedCableRequirement[],
  items: QuoteItem[],
): CableQuantityDiff[] {
  const diffs: CableQuantityDiff[] = []

  for (const req of requirements) {
    const quotedMeters = roundMoney(
      items
        .filter((i) => itemAggregateKey(i) === req.key)
        .reduce((s, i) => s + i.quantity, 0),
    )

    if (quotedMeters === 0) continue

    if (quotedMeters !== req.meters) {
      diffs.push({
        requirementKey: req.key,
        conductorCode: req.conductorCode,
        sectionMm2: req.sectionMm2,
        currentMeters: req.meters,
        quotedMeters,
        delta: roundMoney(req.meters - quotedMeters),
      })
    }
  }

  return diffs
}

/** @deprecated Use diffAggregatedCableQuantities */
export function diffCableQuantities(
  requirements: CableRequirement[],
  items: QuoteItem[],
): CableQuantityDiff[] {
  const projectId = requirements[0]?.projectId
  if (!projectId) return []
  const aggregated = aggregateFromGranular(requirements)
  return diffAggregatedCableQuantities(aggregated, items)
}

/** Sync quote cable lines with current aggregated project totals (merges legacy per-run lines) */
export function syncAggregatedCableQuantities(
  items: QuoteItem[],
  requirements: AggregatedCableRequirement[],
): QuoteItem[] {
  const reqMap = new Map(requirements.map((r) => [r.key, r.meters]))
  const manualItems = items.filter((i) => i.source?.source !== 'cableflow')
  const cableItems = items.filter((i) => i.source?.source === 'cableflow')
  const ungrouped: QuoteItem[] = []

  const groups = new Map<string, QuoteItem[]>()
  for (const item of cableItems) {
    const key = itemAggregateKey(item)
    if (!key) {
      ungrouped.push(item)
      continue
    }
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  const synced: QuoteItem[] = []
  for (const [key, group] of groups) {
    const meters = reqMap.get(key)
    const primary = group[0]!
    if (meters === undefined) {
      synced.push(...group)
      continue
    }
    synced.push(
      recalculateQuoteItem({
        ...primary,
        quantity: meters,
        source: {
          ...primary.source!,
          runId: undefined,
          aggregated: true,
        },
      }),
    )
  }

  return [...manualItems, ...ungrouped, ...synced]
}

export function syncQuoteCableItemsFromProject(quote: Quote, project: ProjectRecord): QuoteItem[] {
  const requirements = aggregateCableRequirements(project)
  return syncAggregatedCableQuantities(quote.items, requirements)
}

export function cableSelectionsFromProject(project: ProjectRecord): Record<string, string> {
  const selections: Record<string, string> = {}
  for (const item of project.materials ?? []) {
    if (!item.cableSourceKey || !item.catalogMaterialId) continue
    const parsed = parseCableMaterialSourceKey(item.cableSourceKey)
    if (!parsed) continue
    selections[cableAggregateKey(parsed.sectionMm2, parsed.conductorCode)] = item.catalogMaterialId
  }
  return selections
}

export function extraProjectMaterials(project: ProjectRecord): ProjectMaterialItem[] {
  return (project.materials ?? []).filter((item) => !item.cableSourceKey)
}

export function buildQuoteItemsFromProjectMaterials(
  items: ProjectMaterialItem[],
  materials: Material[],
  defaultMarginPercent: number,
): QuoteItem[] {
  const materialMap = new Map(materials.map((m) => [m.id, m]))
  const quoteItems: QuoteItem[] = []

  for (const item of items) {
    const material = item.catalogMaterialId ? materialMap.get(item.catalogMaterialId) : undefined
    const unit = item.unit || material?.unit || 'unit'
    const purchaseUnitPrice = material
      ? catalogPriceForLine(material, unit)
      : item.unitPrice
    const saleUnitPrice =
      material?.salePrice && material.unit !== 'roll'
        ? material.salePrice
        : calculateMarginPrice(purchaseUnitPrice, defaultMarginPercent)

    quoteItems.push(
      recalculateQuoteItem({
        id: createId(),
        materialId: material?.id,
        description: item.description || material?.name || '',
        category: material?.category ?? 'other',
        quantity: item.quantity,
        unit,
        purchaseUnitPrice,
        saleUnitPrice,
        purchaseTotal: 0,
        saleTotal: 0,
        source: { source: 'manual' },
      }),
    )
  }

  return quoteItems
}
