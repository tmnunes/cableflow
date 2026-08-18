import type { AppData } from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import type { Material } from '@/types/material'
import type { Quote } from '@/types/quote'
import type { Supplier } from '@/types/supplier'
import { validateAndNormalize } from '@/services/importExport'
import {
  createDefaultAppData,
  createProjectRecord,
  createSampleProjectRecord,
} from '@/services/storage/defaultAppData'
import { readJson } from '@/services/storage/baseStorage'
import { APP_DATA_KEY, LEGACY_PROJECT_KEY } from '@/services/storage/keys'

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return (
    obj.version === DATA_VERSION &&
    Array.isArray(obj.projects) &&
    Array.isArray(obj.materials) &&
    Array.isArray(obj.suppliers) &&
    Array.isArray(obj.quotes) &&
    typeof obj.companySettings === 'object' &&
    obj.companySettings !== null
  )
}

function normalizeAppData(raw: AppData): AppData {
  const defaults = createDefaultAppData()
  return {
    version: DATA_VERSION,
    projects: raw.projects.length > 0 ? raw.projects : defaults.projects,
    materials: raw.materials ?? [],
    suppliers: raw.suppliers ?? [],
    quotes: raw.quotes ?? [],
    companySettings: { ...defaults.companySettings, ...raw.companySettings },
    quoteNumberState: raw.quoteNumberState ?? defaults.quoteNumberState,
    activeProjectId:
      raw.activeProjectId &&
      raw.projects.some((p) => p.id === raw.activeProjectId)
        ? raw.activeProjectId
        : raw.projects[0]?.id,
  }
}

function migrateLegacyProject(): AppData {
  const legacy = readJson<unknown>(LEGACY_PROJECT_KEY)
  const data = createDefaultAppData()

  if (legacy) {
    const result = validateAndNormalize(legacy)
    if (result.ok) {
      const migrated = createProjectRecord({
        projectName: result.project.projectName,
        version: result.project.version,
        items: result.project.items,
      })
      data.projects = [migrated]
      data.activeProjectId = migrated.id
      return data
    }
  }

  const sample = createSampleProjectRecord()
  data.projects = [sample]
  data.activeProjectId = sample.id
  return data
}

export function loadAppData(): AppData {
  const stored = readJson<unknown>(APP_DATA_KEY)

  if (isAppData(stored)) {
    return normalizeAppData(stored)
  }

  const migrated = migrateLegacyProject()
  return migrated
}

export function mergeMaterialsImport(
  current: Material[],
  incoming: Material[],
): Material[] {
  const map = new Map(current.map((m) => [m.id, m]))
  for (const item of incoming) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function mergeSuppliersImport(
  current: Supplier[],
  incoming: Supplier[],
): Supplier[] {
  const map = new Map(current.map((s) => [s.id, s]))
  for (const item of incoming) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function mergeQuotesImport(current: Quote[], incoming: Quote[]): Quote[] {
  const map = new Map(current.map((q) => [q.id, q]))
  for (const item of incoming) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function mergeAppDataImport(current: AppData, incoming: AppData): AppData {
  const projectMap = new Map(current.projects.map((p) => [p.id, p]))
  for (const p of incoming.projects) {
    projectMap.set(p.id, p)
  }

  return normalizeAppData({
    ...current,
    projects: [...projectMap.values()],
    materials: mergeMaterialsImport(current.materials, incoming.materials),
    suppliers: mergeSuppliersImport(current.suppliers, incoming.suppliers),
    quotes: mergeQuotesImport(current.quotes, incoming.quotes),
    companySettings: incoming.companySettings.name
      ? incoming.companySettings
      : current.companySettings,
    quoteNumberState: incoming.quoteNumberState ?? current.quoteNumberState,
  })
}
