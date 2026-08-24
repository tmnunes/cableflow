import type { Circuit, LoadType } from '@/types/electrical'
import type { Material } from '@/types/material'
import type { QuoteItem } from '@/types/quote'
import { catalogPriceForLine } from '@/utils/pricing/catalogLine'
import { calculateMarginPrice } from '@/utils/pricing'
import { recalculateQuoteItem } from '@/utils/quotes'
import { createId } from '@/utils/cn'
import { mapSectionToCableType, protectionLabel } from '@/utils/electrical/panel'
import { CIRCUIT_TYPES } from '@/data/circuits'
import type { CableRun } from '@/types/cable'

export function buildQuoteItemsFromCircuits(
  circuits: Circuit[],
  materials: Material[],
  defaultMarginPercent: number,
): QuoteItem[] {
  const materialMap = new Map(materials.map((item) => [item.id, item]))
  const items: QuoteItem[] = []

  for (const circuit of circuits) {
    const protection = circuit.design?.protection?.option
    const protectionMaterialId = circuit.selectedProtectionMaterialId ?? protection?.materialId
    if (protection && protectionMaterialId) {
      const material = materialMap.get(protectionMaterialId)
      items.push(quoteItemFromMaterial({
        material,
        fallbackDescription: protectionLabel(protection),
        quantity: 1,
        unit: 'unit',
        defaultMarginPercent,
        source: {
          source: 'protection',
          projectId: circuit.projectId,
          circuitId: circuit.id,
          protectionType: protection.type,
        },
      }))
    }

    const cableMaterialId = circuit.selectedCableMaterialId
    const section = circuit.design?.conductor?.recommendedSection
    const length = circuit.installation?.length
    if (cableMaterialId && section && length && length > 0) {
      const material = materialMap.get(cableMaterialId)
      items.push(quoteItemFromMaterial({
        material,
        fallbackDescription: `${material?.name ?? 'Cable'} ${section} mm²`,
        quantity: length,
        unit: 'meter',
        defaultMarginPercent,
        source: {
          source: 'circuit',
          projectId: circuit.projectId,
          circuitId: circuit.id,
          sectionMm2: section,
        },
      }))
    }

    for (const extra of circuit.design?.additionalProtections ?? []) {
      const extraMaterialId = extra.materialId ?? extra.recommended?.materialId
      if (!extra.required || !extraMaterialId) continue
      const material = materialMap.get(extraMaterialId)
      items.push(quoteItemFromMaterial({
        material,
        fallbackDescription: extra.type,
        quantity: 1,
        unit: 'unit',
        defaultMarginPercent,
        source: {
          source: 'protection',
          projectId: circuit.projectId,
          circuitId: circuit.id,
          protectionType: extra.type,
        },
      }))
    }
  }

  return items
}

function quoteItemFromMaterial(input: {
  material?: Material
  fallbackDescription: string
  quantity: number
  unit: string
  defaultMarginPercent: number
  source: QuoteItem['source']
}): QuoteItem {
  const purchaseUnitPrice = input.material
    ? catalogPriceForLine(input.material, input.unit)
    : 0
  const saleUnitPrice =
    input.material?.salePrice && input.material.unit !== 'roll'
      ? input.material.salePrice
      : calculateMarginPrice(purchaseUnitPrice, input.defaultMarginPercent)

  return recalculateQuoteItem({
    id: createId(),
    materialId: input.material?.id,
    description: input.material?.name ?? input.fallbackDescription,
    category: input.material?.category ?? 'protection',
    quantity: input.quantity,
    unit: input.unit,
    purchaseUnitPrice,
    saleUnitPrice,
    purchaseTotal: 0,
    saleTotal: 0,
    source: input.source,
  })
}

export function createCableRunFromCircuit(circuit: Circuit): CableRun | { error: string } {
  const section = circuit.design?.conductor?.recommendedSection
  const type = mapSectionToCableType(section) ?? CIRCUIT_TYPES.find((item) => item.sectionMm2 === section)?.code
  const length = circuit.installation?.length
  if (!section || !type) {
    return { error: 'noMatchingCableType' }
  }
  if (!length || length <= 0) {
    return { error: 'circuitLengthMissing' }
  }
  return {
    id: createId(),
    description: circuit.name,
    distance: length,
    type,
    conduit: Number.NaN,
    spec: '',
    notes: '',
  }
}

export function loadDefaultsFromType(type: LoadType): Pick<
  Circuit['loads'][number],
  'description' | 'unitPower' | 'powerFactor' | 'utilizationFactor' | 'simultaneityFactor'
> {
  return {
    description: type.name,
    unitPower: type.defaultUnitPower,
    powerFactor: type.defaultPowerFactor,
    utilizationFactor: type.defaultUtilizationFactor,
    simultaneityFactor: type.defaultSimultaneityFactor,
  }
}
