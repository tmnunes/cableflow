import type { AppData, AppDataExport, MaterialsExport, SuppliersExport } from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import type { Material } from '@/types/material'
import type { Project, ProjectExport, ProjectMaterialItem } from '@/types/cable'
import type { Supplier } from '@/types/supplier'
import { PROJECT_VERSION } from '@/services/storage/keys'
import { isCircuitType } from '@/utils/validation'
import { createId } from '@/utils/cn'
import { countConductors, parseConduitValue, parseSpec } from '@/utils/parser'
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

  if (Array.isArray(obj.materials)) {
    return { ok: true, data: obj.materials as Material[] }
  }

  return { ok: false, error: 'missingMaterials' }
}

export function parseSuppliersImport(raw: string): EntityImportResult<Supplier[]> {
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

  if (Array.isArray(obj.suppliers)) {
    return { ok: true, data: obj.suppliers as Supplier[] }
  }

  return { ok: false, error: 'missingSuppliers' }
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
