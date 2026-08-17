import type { ConductorCode, CircuitType } from '@/types/cable'
import type { Client } from '@/types/client'
import type { MaterialUnit } from '@/types/material'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export type QuoteItemSource = 'cableflow' | 'manual'

export interface QuoteItemSourceMeta {
  source: QuoteItemSource
  projectId?: string
  runId?: string
  conductorCode?: ConductorCode
  sectionMm2?: number
  /** When true, quantity is the total across all project runs for this section × conductor */
  aggregated?: boolean
}

export interface QuoteItem {
  id: string
  materialId?: string
  description: string
  category: string
  quantity: number
  unit: MaterialUnit | string
  purchaseUnitPrice: number
  saleUnitPrice: number
  marginPercent?: number
  purchaseTotal: number
  saleTotal: number
  source?: QuoteItemSourceMeta
  notes?: string
}

export type LaborUnit = 'hour' | 'day' | 'unit' | 'fixed'

export interface LaborItem {
  id: string
  description: string
  quantity: number
  unit: LaborUnit
  costPerUnit: number
  salePerUnit: number
  totalCost: number
  totalSale: number
  marginPercent?: number
  notes?: string
}

export interface Quote {
  id: string
  number: string
  projectId?: string
  client: Client
  date: string
  validUntil?: string
  status: QuoteStatus
  items: QuoteItem[]
  labor: LaborItem[]
  globalMarginPercent?: number
  taxRate: number
  discount?: number
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
}

/** Per-run requirement — internal granularity from CableFlow calculations */
export interface CableRequirement {
  key: string
  projectId: string
  runId: string
  runDescription: string
  circuitType: CircuitType
  sectionMm2: number
  conductorCode: ConductorCode
  meters: number
}

/** Aggregated by section × conductor — used for quote import UI */
export interface AggregatedCableRequirement {
  key: string
  projectId: string
  sectionMm2: number
  conductorCode: ConductorCode
  meters: number
  runCount: number
}

export function cableAggregateKey(sectionMm2: number, conductorCode: ConductorCode): string {
  return `${sectionMm2}:${conductorCode}`
}
