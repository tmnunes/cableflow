export type { Locale, Theme } from '@/types/ui'

export type {
  CircuitType,
  ConductorCode,
  CircuitTypeDefinition,
  ConductorDefinition,
  ParsedConductor,
  SpecParseResult,
  SpecParseError,
  SpecParseOutcome,
  ProjectMaterialItem,
  CableRun,
  Project,
  ProjectRecord,
  ProjectExport,
  ConductorLength,
  SectionSummary,
  ProjectTotals,
  ProjectSummary,
  SortField,
  SortDirection,
  ValidationErrors,
} from '@/types/cable'

export {
  cableMaterialSourceKey,
  parseCableMaterialSourceKey,
} from '@/types/cable'

export type {
  MaterialCategory,
  MaterialUnit,
  Material,
  MaterialSupplierLink,
} from '@/types/material'
export { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '@/types/material'

export type { Supplier } from '@/types/supplier'
export type { Client } from '@/types/client'
export type {
  CompanySettings,
  QuoteNumberState,
} from '@/types/company'
export {
  defaultCompanySettings,
  defaultQuoteNumberState,
} from '@/types/company'

export type {
  QuoteStatus,
  QuoteItemSource,
  QuoteItemSourceMeta,
  QuoteItem,
  LaborUnit,
  LaborItem,
  Quote,
  CableRequirement,
  AggregatedCableRequirement,
  cableAggregateKey,
} from '@/types/quote'

export type {
  AppData,
  AppDataExport,
  MaterialsExport,
  SuppliersExport,
} from '@/types/app'
export { DATA_VERSION } from '@/types/app'
