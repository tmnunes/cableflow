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

export const PROJECTS_QUOTES_SCHEMA = 'cableflow/projects-quotes' as const

export interface ProjectsQuotesTransfer {
  schema: typeof PROJECTS_QUOTES_SCHEMA
  version: typeof DATA_VERSION
  projects: ProjectRecord[]
  quotes: Quote[]
}

export const SETTINGS_MATERIALS_SUPPLIERS_SCHEMA =
  'cableflow/settings-materials-suppliers' as const

export interface SettingsMaterialsSuppliersTransfer {
  schema: typeof SETTINGS_MATERIALS_SUPPLIERS_SCHEMA
  version: typeof DATA_VERSION
  companySettings: CompanySettings
  quoteNumberState: QuoteNumberState
  materials: Material[]
  suppliers: Supplier[]
}
