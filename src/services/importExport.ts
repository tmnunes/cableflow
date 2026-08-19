import type {
  ProjectsQuotesTransfer,
  SettingsMaterialsSuppliersTransfer,
} from '@/types/app'
import {
  DATA_VERSION,
  PROJECTS_QUOTES_SCHEMA,
  SETTINGS_MATERIALS_SUPPLIERS_SCHEMA,
} from '@/types/app'
import type { Material } from '@/types/material'
import type { ProjectMaterialItem, ProjectRecord } from '@/types/cable'
import type { Supplier } from '@/types/supplier'
import type { CompanySettings, QuoteNumberState } from '@/types/company'
import { defaultCompanySettings } from '@/types/company'
import type { Quote } from '@/types/quote'
import { PROJECT_VERSION } from '@/services/storage/keys'
import { isCircuitType } from '@/utils/validation'
import { createId } from '@/utils/cn'
import { countConductors, parseConduitValue, parseSpec } from '@/utils/parser'
import { normalizeQuote } from '@/utils/quotes'
import type { CableRun } from '@/types/cable'

export type EntityImportResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type ProjectImportResult =
  | { ok: true; project: { projectName: string; version: number; items: CableRun[]; materials: ProjectMaterialItem[] } }
  | { ok: false; error: string }

export function toProjectsQuotesTransfer(
  projects: ProjectRecord[],
  quotes: Quote[],
): ProjectsQuotesTransfer {
  return {
    schema: PROJECTS_QUOTES_SCHEMA,
    version: DATA_VERSION,
    projects,
    quotes,
  }
}

export function toSettingsMaterialsSuppliersTransfer(
  companySettings: CompanySettings,
  quoteNumberState: QuoteNumberState,
  materials: Material[],
  suppliers: Supplier[],
): SettingsMaterialsSuppliersTransfer {
  return {
    schema: SETTINGS_MATERIALS_SUPPLIERS_SCHEMA,
    version: DATA_VERSION,
    companySettings,
    quoteNumberState,
    materials,
    suppliers,
  }
}

export function parseSettingsMaterialsSuppliersImport(
  raw: string,
): EntityImportResult<SettingsMaterialsSuppliersTransfer> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  const obj = parsed.data
  if (obj.schema !== SETTINGS_MATERIALS_SUPPLIERS_SCHEMA) {
    return { ok: false, error: 'invalidSchema' }
  }
  if (obj.version !== DATA_VERSION) {
    return { ok: false, error: 'invalidVersion' }
  }

  const source =
    obj.companySettings && typeof obj.companySettings === 'object' && !Array.isArray(obj.companySettings)
      ? (obj.companySettings as Record<string, unknown>)
      : null

  if (!source) {
    return { ok: false, error: 'missingSettings' }
  }

  const defaults = defaultCompanySettings()
  const companySettings: CompanySettings = {
    ...defaults,
    ...(source as unknown as CompanySettings),
    name: typeof source.name === 'string' ? source.name : '',
    defaultTaxRate:
      typeof source.defaultTaxRate === 'number' && Number.isFinite(source.defaultTaxRate)
        ? source.defaultTaxRate
        : defaults.defaultTaxRate,
    defaultMargin:
      typeof source.defaultMargin === 'number' && Number.isFinite(source.defaultMargin)
        ? source.defaultMargin
        : defaults.defaultMargin,
    quotePrefix: typeof source.quotePrefix === 'string' ? source.quotePrefix : defaults.quotePrefix,
  }

  const quoteNumberState = isQuoteNumberState(obj.quoteNumberState)
    ? obj.quoteNumberState
    : null
  if (!quoteNumberState) {
    return { ok: false, error: 'missingQuoteNumberState' }
  }
  if (!Array.isArray(obj.materials)) {
    return { ok: false, error: 'missingMaterials' }
  }
  if (!Array.isArray(obj.suppliers)) {
    return { ok: false, error: 'missingSuppliers' }
  }

  return {
    ok: true,
    data: {
      schema: SETTINGS_MATERIALS_SUPPLIERS_SCHEMA,
      version: DATA_VERSION,
      companySettings,
      quoteNumberState,
      materials: obj.materials as Material[],
      suppliers: obj.suppliers as Supplier[],
    },
  }
}

export function parseProjectsQuotesImport(
  raw: string,
): EntityImportResult<ProjectsQuotesTransfer> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  const obj = parsed.data
  if (obj.schema !== PROJECTS_QUOTES_SCHEMA) {
    return { ok: false, error: 'invalidSchema' }
  }
  if (obj.version !== DATA_VERSION) {
    return { ok: false, error: 'invalidVersion' }
  }
  if (!Array.isArray(obj.projects)) {
    return { ok: false, error: 'missingProjects' }
  }
  if (!Array.isArray(obj.quotes)) {
    return { ok: false, error: 'missingQuotes' }
  }

  const projects: ProjectRecord[] = []
  for (const item of obj.projects) {
    const record = asProjectRecord(item)
    if (!record) {
      return { ok: false, error: 'invalidItem' }
    }
    projects.push(record)
  }

  const quotes = obj.quotes.map(asQuote).filter((q): q is Quote => q !== null)
  if (quotes.length !== obj.quotes.length) {
    return { ok: false, error: 'invalidQuote' }
  }

  return {
    ok: true,
    data: {
      schema: PROJECTS_QUOTES_SCHEMA,
      version: DATA_VERSION,
      projects,
      quotes,
    },
  }
}

export function validateAndNormalize(data: unknown): ProjectImportResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'invalidStructure' }
  }

  const obj = data as Record<string, unknown>

  if (typeof obj.projectName !== 'string' || !obj.projectName.trim()) {
    return { ok: false, error: 'missingProjectName' }
  }

  if (obj.version !== undefined && typeof obj.version !== 'number') {
    return { ok: false, error: 'invalidVersion' }
  }

  if (!Array.isArray(obj.items)) {
    return { ok: false, error: 'missingItems' }
  }

  const items: CableRun[] = []

  for (let index = 0; index < obj.items.length; index += 1) {
    const item = obj.items[index]
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: 'invalidItem' }
    }

    const row = item as Record<string, unknown>
    const result = normalizeItem(row, index)
    if (!result.ok) {
      return result
    }
    items.push(result.item)
  }

  const materials: ProjectMaterialItem[] = []
  if (Array.isArray(obj.materials)) {
    for (const mat of obj.materials) {
      if (mat && typeof mat === 'object' && !Array.isArray(mat)) {
        const m = mat as Record<string, unknown>
        materials.push({
          id: typeof m.id === 'string' && m.id ? m.id : createId(),
          description: typeof m.description === 'string' ? m.description : '',
          quantity: typeof m.quantity === 'number' && Number.isFinite(m.quantity) ? m.quantity : 1,
          unit: typeof m.unit === 'string' ? m.unit : 'unit',
          unitPrice: typeof m.unitPrice === 'number' && Number.isFinite(m.unitPrice) ? m.unitPrice : 0,
          notes: typeof m.notes === 'string' ? m.notes : '',
        })
      }
    }
  }

  return {
    ok: true,
    project: {
      projectName: obj.projectName.trim(),
      version: typeof obj.version === 'number' ? obj.version : PROJECT_VERSION,
      items,
      materials,
    },
  }
}

function normalizeItem(
  row: Record<string, unknown>,
  index: number,
): { ok: true; item: CableRun } | { ok: false; error: string } {
  if (typeof row.description !== 'string' || !row.description.trim()) {
    return { ok: false, error: `itemDescription:${index}` }
  }

  if (typeof row.distance !== 'number' || !Number.isFinite(row.distance) || row.distance <= 0) {
    return { ok: false, error: `itemDistance:${index}` }
  }

  if (typeof row.type !== 'string' || !isCircuitType(row.type)) {
    return { ok: false, error: `itemType:${index}` }
  }

  const conduit = parseConduitValue(row.conduit)
  if (conduit === null) {
    return { ok: false, error: `itemConduit:${index}` }
  }

  if (typeof row.spec !== 'string' || !row.spec.trim()) {
    return { ok: false, error: `itemSpec:${index}` }
  }

  const parsed = parseSpec(row.spec)
  if (!parsed.ok) {
    return { ok: false, error: `itemSpecParse:${index}` }
  }

  const specCount = countConductors(parsed.conductors)
  if (specCount !== conduit) {
    return { ok: false, error: `itemConduitMismatch:${index}` }
  }

  const notes = typeof row.notes === 'string' ? row.notes : ''
  const id = typeof row.id === 'string' && row.id ? row.id : createId()

  return {
    ok: true,
    item: {
      id,
      description: row.description.trim(),
      distance: row.distance,
      type: row.type,
      conduit,
      spec: row.spec.trim().toUpperCase(),
      notes,
    },
  }
}

function parseJsonObject(
  raw: string,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalidJson' }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'invalidStructure' }
  }

  return { ok: true, data: data as Record<string, unknown> }
}

function isQuoteNumberState(value: unknown): value is QuoteNumberState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  return (
    typeof state.prefix === 'string' &&
    typeof state.year === 'number' &&
    typeof state.lastSequence === 'number'
  )
}

function asQuote(value: unknown): Quote | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const quote = value as Quote
  if (typeof quote.id !== 'string' || !quote.id) return null
  if (typeof quote.number !== 'string') return null
  if (!quote.client || typeof quote.client !== 'object' || Array.isArray(quote.client)) return null
  if (!Array.isArray(quote.items) || !Array.isArray(quote.labor)) return null

  const now = new Date().toISOString()
  return normalizeQuote({
    ...quote,
    date: typeof quote.date === 'string' && quote.date ? quote.date : now.slice(0, 10),
    status: quote.status ?? 'draft',
    taxRate: typeof quote.taxRate === 'number' && Number.isFinite(quote.taxRate) ? quote.taxRate : 0,
    createdAt: typeof quote.createdAt === 'string' ? quote.createdAt : now,
    updatedAt: typeof quote.updatedAt === 'string' ? quote.updatedAt : now,
  })
}

function asProjectRecord(value: unknown): ProjectRecord | null {
  const result = validateAndNormalize(value)
  if (!result.ok) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const obj = value as Record<string, unknown>
  const now = new Date().toISOString()
  return {
    ...result.project,
    id: typeof obj.id === 'string' && obj.id ? obj.id : createId(),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : now,
  }
}
