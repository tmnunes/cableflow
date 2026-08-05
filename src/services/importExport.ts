import type { CableRun, Project, ProjectExport } from '@/types'
import { PROJECT_VERSION } from '@/data/circuits'
import { isCircuitType } from '@/utils/validation'
import { createId } from '@/utils/cn'
import { countConductors, parseConduitValue, parseSpec } from '@/utils/parser'

export type ImportResult =
  | { ok: true; project: Project }
  | { ok: false; error: string }

export function toExportPayload(project: Project): ProjectExport {
  return {
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

  return {
    ok: true,
    project: {
      projectName: obj.projectName.trim(),
      version: typeof obj.version === 'number' ? obj.version : PROJECT_VERSION,
      items,
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
