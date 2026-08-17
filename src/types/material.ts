export type MaterialCategory =
  | 'cables'
  | 'conduit'
  | 'boxes'
  | 'devices'
  | 'panels'
  | 'protection'
  | 'breakers'
  | 'rcd'
  | 'contactors'
  | 'busbar'
  | 'terminals'
  | 'connectors'
  | 'fixings'
  | 'lighting'
  | 'network'
  | 'photovoltaic'
  | 'other'

export type MaterialUnit =
  | 'unit'
  | 'meter'
  | 'roll'
  | 'box'
  | 'set'
  | 'hour'
  | 'kg'
  | 'other'

export interface Material {
  id: string
  code?: string
  name: string
  category: MaterialCategory
  unit: MaterialUnit
  brand?: string
  model?: string
  description?: string
  purchasePrice: number
  salePrice?: number
  supplierId?: string
  notes?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Prepared for future multi-supplier support */
export interface MaterialSupplierLink {
  materialId: string
  supplierId: string
  purchasePrice: number
  isPrimary: boolean
  notes?: string
}

export const MATERIAL_CATEGORIES: readonly MaterialCategory[] = [
  'cables',
  'conduit',
  'boxes',
  'devices',
  'panels',
  'protection',
  'breakers',
  'rcd',
  'contactors',
  'busbar',
  'terminals',
  'connectors',
  'fixings',
  'lighting',
  'network',
  'photovoltaic',
  'other',
] as const

export const MATERIAL_UNITS: readonly MaterialUnit[] = [
  'unit',
  'meter',
  'roll',
  'box',
  'set',
  'hour',
  'kg',
  'other',
] as const
