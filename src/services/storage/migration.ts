import type { AppData } from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import type { Circuit, ElectricalRuleSet, LoadType } from '@/types/electrical'
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
import {
  createDefaultElectricalRuleSets,
  createDefaultLoadTypes,
} from '@/data/electrical'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isLegacyV2(value: unknown): value is Omit<AppData, 'circuits' | 'loadTypes' | 'electricalRuleSets' | 'version'> & { version: 2 } {
  if (!isRecord(value)) return false
  return (
    value.version === 2 &&
    Array.isArray(value.projects) &&
    Array.isArray(value.materials) &&
    Array.isArray(value.suppliers) &&
    Array.isArray(value.quotes) &&
    typeof value.companySettings === 'object' &&
    value.companySettings !== null
  )
}

function isAppData(value: unknown): value is AppData {
  if (!isRecord(value)) return false
  return (
    value.version === DATA_VERSION &&
    Array.isArray(value.projects) &&
    Array.isArray(value.materials) &&
    Array.isArray(value.suppliers) &&
    Array.isArray(value.quotes) &&
    Array.isArray(value.circuits) &&
    Array.isArray(value.loadTypes) &&
    Array.isArray(value.electricalRuleSets) &&
    typeof value.companySettings === 'object' &&
    value.companySettings !== null
  )
}

function migrateV2ToV3(raw: Record<string, unknown>): AppData {
  const defaults = createDefaultAppData()
  return normalizeAppData({
    ...defaults,
    ...raw,
    version: DATA_VERSION,
    projects: (raw.projects as AppData['projects']) ?? defaults.projects,
    materials: (raw.materials as Material[]) ?? [],
    suppliers: (raw.suppliers as Supplier[]) ?? [],
    quotes: (raw.quotes as Quote[]) ?? [],
    circuits: Array.isArray(raw.circuits) ? (raw.circuits as Circuit[]) : [],
    loadTypes: Array.isArray(raw.loadTypes) && raw.loadTypes.length > 0
      ? (raw.loadTypes as LoadType[])
      : defaults.loadTypes,
    electricalRuleSets:
      Array.isArray(raw.electricalRuleSets) && raw.electricalRuleSets.length > 0
        ? (raw.electricalRuleSets as ElectricalRuleSet[])
        : defaults.electricalRuleSets,
    companySettings: raw.companySettings as AppData['companySettings'],
    quoteNumberState: (raw.quoteNumberState as AppData['quoteNumberState']) ?? defaults.quoteNumberState,
    activeProjectId: raw.activeProjectId as string | undefined,
  })
}

function normalizeAppData(raw: AppData): AppData {
  const defaults = createDefaultAppData()
  return {
    version: DATA_VERSION,
    projects: raw.projects.length > 0 ? raw.projects : defaults.projects,
    materials: raw.materials ?? [],
    suppliers: raw.suppliers ?? [],
    quotes: raw.quotes ?? [],
    circuits: raw.circuits ?? [],
    loadTypes: raw.loadTypes?.length ? raw.loadTypes : createDefaultLoadTypes(),
    electricalRuleSets: raw.electricalRuleSets?.length
      ? raw.electricalRuleSets
      : createDefaultElectricalRuleSets(),
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

  if (isLegacyV2(stored)) {
    return migrateV2ToV3(stored)
  }

  return migrateLegacyProject()
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

export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]))
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
    circuits: mergeById(current.circuits, incoming.circuits ?? []),
    loadTypes: mergeById(current.loadTypes, incoming.loadTypes ?? []),
    electricalRuleSets: mergeById(current.electricalRuleSets, incoming.electricalRuleSets ?? []),
    companySettings: incoming.companySettings.name
      ? incoming.companySettings
      : current.companySettings,
    quoteNumberState: incoming.quoteNumberState ?? current.quoteNumberState,
  })
}
