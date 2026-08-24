import type {
  Circuit,
  PanelCircuitRow,
  ProtectionSummaryItem,
} from '@/types/electrical'

export function protectionKey(item: {
  type: string
  rating?: number
  poles?: number
  curve?: string
  materialId?: string
}): string {
  return [item.type, item.rating ?? '', item.poles ?? '', item.curve ?? '', item.materialId ?? ''].join(':')
}

export function protectionLabel(item: {
  type: string
  rating?: number
  poles?: number
  curve?: string
}): string {
  const parts = [item.type]
  if (item.rating) parts.push(`${item.rating} A`)
  if (item.curve) parts.push(item.curve)
  if (item.poles) parts.push(`${item.poles}P`)
  return parts.join(' ')
}

export function buildPanelRows(circuits: Circuit[]): PanelCircuitRow[] {
  return circuits.map((circuit) => {
    const protection = circuit.design?.protection?.option
    return {
      circuitId: circuit.id,
      name: circuit.name,
      category: circuit.category,
      installedPower: circuit.design?.installedPower ?? 0,
      designPower: circuit.design?.designPower ?? 0,
      designCurrent: circuit.design?.designCurrent ?? 0,
      sectionMm2: circuit.design?.conductor?.recommendedSection,
      protectionLabel: protection ? protectionLabel(protection) : undefined,
      validation: circuit.design?.validation.status ?? 'warning',
    }
  })
}

export function summarizeProtections(circuits: Circuit[]): ProtectionSummaryItem[] {
  const map = new Map<string, ProtectionSummaryItem>()

  const add = (item: {
    type: ProtectionSummaryItem['type']
    rating?: number
    poles?: number
    curve?: string
    materialId?: string
  }) => {
    const key = protectionKey(item)
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
      return
    }
    map.set(key, { ...item, key, count: 1 })
  }

  for (const circuit of circuits) {
    const main = circuit.design?.protection?.option
    if (main) {
      add({
        type: main.type,
        rating: main.rating,
        poles: main.poles,
        curve: main.curve,
        materialId: circuit.selectedProtectionMaterialId ?? main.materialId,
      })
    }
    for (const extra of circuit.design?.additionalProtections ?? []) {
      if (!extra.required) continue
      add({
        type: extra.type,
        rating: extra.recommended?.rating,
        poles: extra.recommended?.poles,
        curve: extra.recommended?.curve,
        materialId: extra.materialId ?? extra.recommended?.materialId,
      })
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type)
    return (a.rating ?? 0) - (b.rating ?? 0)
  })
}

export function mapSectionToCableType(sectionMm2?: number): 'I' | 'T' | 'P' | 'Q' | 'G' | undefined {
  if (sectionMm2 === 1.5) return 'I'
  if (sectionMm2 === 2.5) return 'T'
  if (sectionMm2 === 4) return 'P'
  if (sectionMm2 === 10) return 'Q'
  if (sectionMm2 === 16) return 'G'
  return undefined
}
