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
  createDefaultProtectionMaterials,
  EXAMPLE_ELECTRICAL_RULE_SET,
} from '@/data/electrical'
import { calculateCircuitDesign } from '@/utils/electrical/circuitDesign'

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

function nowIso(): string {
  return new Date().toISOString()
}

function mergeExampleCatalogs(raw: AppData): AppData {
  const timestamp = nowIso()
  const exampleMaterials = createDefaultProtectionMaterials(timestamp)
  const exampleLoadTypes = createDefaultLoadTypes(timestamp)
  const latestExampleVersion = EXAMPLE_ELECTRICAL_RULE_SET.version
  const upgradedRuleSets = (raw.electricalRuleSets ?? []).map((ruleSet) => {
    if (
      ruleSet.id === 'example-default-v1' &&
      ruleSet.isExample &&
      ruleSet.version !== latestExampleVersion
    ) {
      const fresh = createDefaultElectricalRuleSets(timestamp)[0]!
      return { ...fresh, createdAt: ruleSet.createdAt }
    }
    return ruleSet
  })

  // Add any new example load types without overwriting user-edited rows.
  const loadTypeMap = new Map((raw.loadTypes ?? []).map((item) => [item.id, item]))
  for (const item of exampleLoadTypes) {
    if (!loadTypeMap.has(item.id)) {
      loadTypeMap.set(item.id, item)
    }
  }

  return {
    ...raw,
    materials: mergeById(raw.materials ?? [], exampleMaterials),
    loadTypes: [...loadTypeMap.values()],
    electricalRuleSets: upgradedRuleSets.length
      ? upgradedRuleSets
      : createDefaultElectricalRuleSets(timestamp),
  }
}

/** Recompute stored circuit designs so rule-set upgrades take effect immediately. */
function refreshCircuitDesigns(data: AppData): Circuit[] {
  const ruleSet =
    data.electricalRuleSets.find((item) => item.active) ?? data.electricalRuleSets[0]
  if (!ruleSet) return data.circuits ?? []

  return (data.circuits ?? []).map((circuit) => {
    const design = calculateCircuitDesign({
      circuit,
      ruleSet,
      loadTypes: data.loadTypes,
    })
    return {
      ...circuit,
      design,
      selectedProtectionMaterialId:
        circuit.selectedProtectionMaterialId !== undefined
          ? circuit.selectedProtectionMaterialId
          : design.protection?.option?.materialId,
    }
  })
}

function normalizeAppData(raw: AppData): AppData {
  const defaults = createDefaultAppData()
  const merged = mergeExampleCatalogs(raw)
  const normalized: AppData = {
    version: DATA_VERSION,
    projects: merged.projects.length > 0 ? merged.projects : defaults.projects,
    materials: merged.materials.length > 0 ? merged.materials : exampleMaterialsFallback(),
    suppliers: merged.suppliers ?? [],
    quotes: merged.quotes ?? [],
    circuits: merged.circuits ?? [],
    loadTypes: merged.loadTypes?.length ? merged.loadTypes : createDefaultLoadTypes(),
    electricalRuleSets: merged.electricalRuleSets?.length
      ? merged.electricalRuleSets
      : createDefaultElectricalRuleSets(),
    companySettings: { ...defaults.companySettings, ...merged.companySettings },
    quoteNumberState: merged.quoteNumberState ?? defaults.quoteNumberState,
    activeProjectId:
      merged.activeProjectId &&
      merged.projects.some((p) => p.id === merged.activeProjectId)
        ? merged.activeProjectId
        : merged.projects[0]?.id,
  }

  return {
    ...normalized,
    circuits: refreshCircuitDesigns(normalized),
  }
}

function exampleMaterialsFallback(): Material[] {
  return createDefaultProtectionMaterials(nowIso())
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
