import type {
  AppData,
  AppDataExport,
  MaterialsExport,
  ProjectsExport,
  QuotesExport,
  SettingsExport,
  SuppliersExport,
} from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import type { Material } from '@/types/material'
import type { Project, ProjectExport, ProjectMaterialItem, ProjectRecord } from '@/types/cable'
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

export type ImportResult =
  | { ok: true; project: Project }
  | { ok: false; error: string }

export type BackupImportResult =
  | { ok: true; data: AppDataExport }
  | { ok: false; error: string }

export type EntityImportResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function toExportPayload(project: Project): ProjectExport {
  const payload: ProjectExport = {
    projectName: project.projectName,
    version: PROJECT_VERSION,
    items: project.items.map(({ description, distance, type, conduit, spec, notes }) => ({
      description,
      distance,
      type,
      conduit,
      spec,
      notes: notes ?? '',
    })),
  }
  if (project.materials && project.materials.length > 0) {
    payload.materials = project.materials.map(({ description, quantity, unit, unitPrice, notes }) => ({
      description,
      quantity,
      unit,
      unitPrice,
      notes: notes ?? '',
    }))
  }
  return payload
}

export function toAppDataExport(data: AppData): AppDataExport {
  return {
    version: DATA_VERSION,
    projects: data.projects,
    materials: data.materials,
    suppliers: data.suppliers,
    quotes: data.quotes,
    companySettings: data.companySettings,
    quoteNumberState: data.quoteNumberState,
  }
}

export function toMaterialsExport(materials: Material[]): MaterialsExport {
  return { version: DATA_VERSION, materials }
}

export function toSuppliersExport(suppliers: Supplier[]): SuppliersExport {
  return { version: DATA_VERSION, suppliers }
}

export function toSettingsExport(
  companySettings: CompanySettings,
  quoteNumberState?: QuoteNumberState,
): SettingsExport {
  return { version: DATA_VERSION, companySettings, quoteNumberState }
}

export function toQuotesExport(quotes: Quote[]): QuotesExport {
  return { version: DATA_VERSION, quotes }
}

export function toProjectsExport(projects: ProjectRecord[]): ProjectsExport {
  return { version: DATA_VERSION, projects }
}

export function parseImportJson(raw: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalidJson' }
  }

  return validateAndNormalize(data)
}

export function parseBackupImport(raw: string): BackupImportResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalidJson' }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'invalidStructure' }
  }

  const obj = data as Record<string, unknown>
  if (obj.version !== DATA_VERSION) {
    return { ok: false, error: 'invalidVersion' }
  }

  if (!Array.isArray(obj.projects) || !Array.isArray(obj.materials) || !Array.isArray(obj.suppliers)) {
    return { ok: false, error: 'invalidStructure' }
  }

  return {
    ok: true,
    data: {
      version: DATA_VERSION,
      projects: obj.projects as AppDataExport['projects'],
      materials: obj.materials as Material[],
      suppliers: obj.suppliers as Supplier[],
      quotes: (obj.quotes as AppDataExport['quotes']) ?? [],
      companySettings: obj.companySettings as AppDataExport['companySettings'],
      quoteNumberState: obj.quoteNumberState as AppDataExport['quoteNumberState'],
    },
  }
}

export function parseMaterialsImport(raw: string): EntityImportResult<Material[]> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  if (Array.isArray(parsed.data.materials)) {
    return { ok: true, data: parsed.data.materials as Material[] }
  }

  return { ok: false, error: 'missingMaterials' }
}

export function parseSuppliersImport(raw: string): EntityImportResult<Supplier[]> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  if (Array.isArray(parsed.data.suppliers)) {
    return { ok: true, data: parsed.data.suppliers as Supplier[] }
  }

  return { ok: false, error: 'missingSuppliers' }
}

export function parseSettingsImport(raw: string): EntityImportResult<SettingsExport> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  const obj = parsed.data
  const source =
    obj.companySettings && typeof obj.companySettings === 'object' && !Array.isArray(obj.companySettings)
      ? (obj.companySettings as Record<string, unknown>)
      : isBareCompanySettings(obj)
        ? obj
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
    : undefined

  return { ok: true, data: { version: DATA_VERSION, companySettings, quoteNumberState } }
}

export function parseQuotesImport(raw: string): EntityImportResult<Quote[]> {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  const obj = parsed.data
  if (Array.isArray(obj.quotes)) {
    const quotes = obj.quotes.map(asQuote).filter((q): q is Quote => q !== null)
    if (quotes.length === 0 && obj.quotes.length > 0) {
      return { ok: false, error: 'invalidStructure' }
    }
    return { ok: true, data: quotes }
  }

  const single = asQuote(obj.quote)
  if (single) {
    return { ok: true, data: [single] }
  }

  return { ok: false, error: 'missingQuotes' }
}

export type ProjectsImportResult =
  | { ok: true; kind: 'single'; project: Project }
  | { ok: true; kind: 'collection'; projects: ProjectRecord[] }
  | { ok: false; error: string }

export function parseProjectsImport(raw: string): ProjectsImportResult {
  const parsed = parseJsonObject(raw)
  if (!parsed.ok) return parsed

  const obj = parsed.data
  if (Array.isArray(obj.projects)) {
    const projects: ProjectRecord[] = []
    for (const item of obj.projects) {
      const record = asProjectRecord(item)
      if (!record) {
        return { ok: false, error: 'invalidItem' }
      }
      projects.push(record)
    }
    return { ok: true, kind: 'collection', projects }
  }

  const single = validateAndNormalize(obj)
  if (!single.ok) return single
  return { ok: true, kind: 'single', project: single.project }
}

export function validateAndNormalize(data: unknown): ImportResult {
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

function isBareCompanySettings(obj: Record<string, unknown>): boolean {
  return (
    typeof obj.name === 'string' &&
    typeof obj.quotePrefix === 'string' &&
    !('companySettings' in obj) &&
    !('projects' in obj) &&
    !('materials' in obj)
  )
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
