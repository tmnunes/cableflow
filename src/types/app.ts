import type { ProjectRecord } from '@/types/cable'
import type { CompanySettings, QuoteNumberState } from '@/types/company'
import type { Material } from '@/types/material'
import type { Quote } from '@/types/quote'
import type { Supplier } from '@/types/supplier'

export const DATA_VERSION = 2 as const

export interface AppData {
  version: typeof DATA_VERSION
  projects: ProjectRecord[]
  materials: Material[]
  suppliers: Supplier[]
  quotes: Quote[]
  companySettings: CompanySettings
  quoteNumberState: QuoteNumberState
  activeProjectId?: string
}

export interface AppDataExport {
  version: typeof DATA_VERSION
  projects: ProjectRecord[]
  materials: Material[]
  suppliers: Supplier[]
  quotes: Quote[]
  companySettings: CompanySettings
  quoteNumberState: QuoteNumberState
}

export interface MaterialsExport {
  version: typeof DATA_VERSION
  materials: Material[]
}

export interface SuppliersExport {
  version: typeof DATA_VERSION
  suppliers: Supplier[]
}

export interface QuoteExport {
  version: typeof DATA_VERSION
  quote: Quote
}
