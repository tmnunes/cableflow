import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData } from '@/types/app'
import type { Material, MaterialCategory, MaterialUnit } from '@/types/material'
import type { ProjectRecord } from '@/types/cable'
import type { Supplier } from '@/types/supplier'
import type { Locale, Theme } from '@/types'
import { loadAppData, saveAppData } from '@/services/storage/appDataStore'
import {
  loadLocale,
  loadTheme,
  saveLocale,
  saveTheme,
} from '@/services/storage/preferencesStorage'
import type { CompanySettings, QuoteNumberState } from '@/types/company'
import type { Quote } from '@/types/quote'
import type { Circuit, ElectricalRuleSet, LoadType } from '@/types/electrical'
import { allocateQuoteNumber } from '@/services/quotes/quoteNumber'
import { createProjectRecord } from '@/services/storage/defaultAppData'
import { normalizeQuote } from '@/utils/quotes'
import { createId } from '@/utils/cn'
import { calculateCircuitDesign } from '@/utils/electrical'

function nowIso(): string {
  return new Date().toISOString()
}

interface AppDataContextValue {
  data: AppData
  theme: Theme
  locale: Locale
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  setActiveProjectId: (id: string) => void
  replaceAppData: (data: AppData) => void

  // Projects
  projects: ProjectRecord[]
  activeProject: ProjectRecord | undefined
  createProject: (name?: string) => ProjectRecord
  updateProject: (id: string, patch: Partial<Pick<ProjectRecord, 'projectName' | 'items' | 'materials'>>) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => ProjectRecord | undefined
  importProject: (project: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'> | ProjectRecord) => ProjectRecord
  importProjectRecords: (records: ProjectRecord[]) => void

  // Materials
  materials: Material[]
  upsertMaterial: (material: Material) => void
  deleteMaterial: (id: string) => void
  setMaterials: (materials: Material[]) => void

  // Suppliers
  suppliers: Supplier[]
  upsertSupplier: (supplier: Supplier) => void
  deleteSupplier: (id: string) => void
  setSuppliers: (suppliers: Supplier[]) => void

  // Quotes
  quotes: Quote[]
  upsertQuote: (quote: Quote) => void
  deleteQuote: (id: string) => void
  createQuote: (projectId?: string) => Quote
  importQuotes: (quotes: Quote[]) => void

  // Circuits
  circuits: Circuit[]
  upsertCircuit: (circuit: Circuit) => void
  deleteCircuit: (id: string) => void
  importCircuits: (circuits: Circuit[]) => void
  createCircuit: (projectId: string, name?: string) => Circuit
  duplicateCircuit: (id: string) => Circuit | undefined

  // Load types
  loadTypes: LoadType[]
  upsertLoadType: (loadType: LoadType) => void
  deleteLoadType: (id: string) => void
  setLoadTypes: (loadTypes: LoadType[]) => void

  // Electrical rules
  electricalRuleSets: ElectricalRuleSet[]
  upsertElectricalRuleSet: (ruleSet: ElectricalRuleSet) => void
  setElectricalRuleSets: (ruleSets: ElectricalRuleSet[]) => void
  activeRuleSet: ElectricalRuleSet | undefined

  // Company
  companySettings: CompanySettings
  updateCompanySettings: (patch: Partial<CompanySettings>) => void
  importCompanySettings: (settings: CompanySettings, quoteNumberState?: QuoteNumberState) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadAppData()
    saveAppData(loaded)
    return loaded
  })
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveAppData(data), 300)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    saveLocale(locale)
  }, [locale])

  const setTheme = useCallback((value: Theme) => setThemeState(value), [])
  const setLocale = useCallback((value: Locale) => setLocaleState(value), [])

  const replaceAppData = useCallback((next: AppData) => setData(next), [])

  const setActiveProjectId = useCallback((id: string) => {
    setData((prev) => (prev.activeProjectId === id ? prev : { ...prev, activeProjectId: id }))
  }, [])

  const projects = data.projects
  const activeProject = useMemo(
    () => projects.find((p) => p.id === data.activeProjectId) ?? projects[0],
    [projects, data.activeProjectId],
  )

  const createProject = useCallback((name = ''): ProjectRecord => {
    const record = createProjectRecord({ projectName: name, items: [] })
    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, record],
      activeProjectId: record.id,
    }))
    return record
  }, [])

  const updateProject = useCallback(
    (id: string, patch: Partial<Pick<ProjectRecord, 'projectName' | 'items' | 'materials'>>) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p,
        ),
      }))
    },
    [],
  )

  const deleteProject = useCallback((id: string) => {
    setData((prev) => {
      const nextProjects = prev.projects.filter((p) => p.id !== id)
      const nextCircuits = prev.circuits.filter((c) => c.projectId !== id)
      if (nextProjects.length === 0) {
        const fallback = createProjectRecord({ projectName: '', items: [] })
        return {
          ...prev,
          projects: [fallback],
          circuits: nextCircuits,
          activeProjectId: fallback.id,
        }
      }
      const nextActive =
        prev.activeProjectId === id ? nextProjects[0]!.id : prev.activeProjectId
      return { ...prev, projects: nextProjects, circuits: nextCircuits, activeProjectId: nextActive }
    })
  }, [])

  const duplicateProject = useCallback((id: string): ProjectRecord | undefined => {
    let copy: ProjectRecord | undefined
    setData((prev) => {
      const source = prev.projects.find((p) => p.id === id)
      if (!source) return prev
      copy = createProjectRecord({
        projectName: `${source.projectName} (copy)`,
        version: source.version,
        items: source.items.map((item) => ({ ...item, id: createId() })),
        materials: (source.materials ?? []).map((m) => ({ ...m, id: createId() })),
      })
      const duplicated = copy
      const copiedCircuits = prev.circuits
        .filter((circuit) => circuit.projectId === id)
        .map((circuit) => ({
          ...circuit,
          id: createId(),
          projectId: duplicated.id,
          linkedCableRunId: undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }))
      return {
        ...prev,
        projects: [...prev.projects, duplicated],
        circuits: [...prev.circuits, ...copiedCircuits],
        activeProjectId: duplicated.id,
      }
    })
    return copy
  }, [])

  const importProject = useCallback(
    (project: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'> | ProjectRecord): ProjectRecord => {
      const record = createProjectRecord(project)
      setData((prev) => ({
        ...prev,
        projects: [...prev.projects, record],
        activeProjectId: record.id,
      }))
      return record
    },
    [],
  )

  const importProjectRecords = useCallback((records: ProjectRecord[]) => {
    setData((prev) => {
      const map = new Map(prev.projects.map((p) => [p.id, p]))
      for (const record of records) {
        map.set(record.id, record)
      }
      return { ...prev, projects: [...map.values()] }
    })
  }, [])

  const upsertMaterial = useCallback((material: Material) => {
    setData((prev) => {
      const exists = prev.materials.some((m) => m.id === material.id)
      const materials = exists
        ? prev.materials.map((m) => (m.id === material.id ? material : m))
        : [...prev.materials, material]
      return { ...prev, materials }
    })
  }, [])

  const deleteMaterial = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }))
  }, [])

  const setMaterials = useCallback((materials: Material[]) => {
    setData((prev) => ({ ...prev, materials }))
  }, [])

  const upsertSupplier = useCallback((supplier: Supplier) => {
    setData((prev) => {
      const exists = prev.suppliers.some((s) => s.id === supplier.id)
      const suppliers = exists
        ? prev.suppliers.map((s) => (s.id === supplier.id ? supplier : s))
        : [...prev.suppliers, supplier]
      return { ...prev, suppliers }
    })
  }, [])

  const deleteSupplier = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }))
  }, [])

  const setSuppliers = useCallback((suppliers: Supplier[]) => {
    setData((prev) => ({ ...prev, suppliers }))
  }, [])

  const upsertQuote = useCallback((quote: Quote) => {
    const normalized = normalizeQuote({ ...quote, updatedAt: nowIso() })
    setData((prev) => {
      const exists = prev.quotes.some((q) => q.id === normalized.id)
      const quotes = exists
        ? prev.quotes.map((q) => (q.id === normalized.id ? normalized : q))
        : [...prev.quotes, normalized]
      return { ...prev, quotes }
    })
  }, [])

  const deleteQuote = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }))
  }, [])

  const createQuote = useCallback((projectId?: string): Quote => {
    const { number, nextState } = allocateQuoteNumber(data.quoteNumberState)
    const quote = createEmptyQuote(number, data.companySettings, projectId)
    setData((prev) => ({
      ...prev,
      quotes: [...prev.quotes, quote],
      quoteNumberState: nextState,
    }))
    return quote
  }, [data.quoteNumberState, data.companySettings])

  const importQuotes = useCallback((quotes: Quote[]) => {
    setData((prev) => {
      const map = new Map(prev.quotes.map((q) => [q.id, q]))
      for (const quote of quotes) {
        const normalized = normalizeQuote(quote)
        map.set(normalized.id, normalized)
      }
      return { ...prev, quotes: [...map.values()] }
    })
  }, [])

  const refreshCircuit = useCallback((circuit: Circuit, dataSnapshot: AppData): Circuit => {
    const ruleSet = dataSnapshot.electricalRuleSets.find((item) => item.active) ?? dataSnapshot.electricalRuleSets[0]
    if (!ruleSet) return { ...circuit, updatedAt: nowIso() }
    const design = calculateCircuitDesign({
      circuit,
      ruleSet,
      loadTypes: dataSnapshot.loadTypes,
    })
    const suggestedProtectionMaterialId = design.protection?.option?.materialId
    return {
      ...circuit,
      design,
      selectedProtectionMaterialId:
        circuit.selectedProtectionMaterialId !== undefined
          ? circuit.selectedProtectionMaterialId
          : suggestedProtectionMaterialId,
      updatedAt: nowIso(),
    }
  }, [])

  const upsertCircuit = useCallback((circuit: Circuit) => {
    setData((prev) => {
      const next = refreshCircuit(circuit, prev)
      const exists = prev.circuits.some((item) => item.id === next.id)
      const circuits = exists
        ? prev.circuits.map((item) => (item.id === next.id ? next : item))
        : [...prev.circuits, next]
      return { ...prev, circuits }
    })
  }, [refreshCircuit])

  const deleteCircuit = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      circuits: prev.circuits.filter((item) => item.id !== id),
    }))
  }, [])

  const importCircuits = useCallback((circuits: Circuit[]) => {
    setData((prev) => {
      const map = new Map(prev.circuits.map((item) => [item.id, item]))
      for (const circuit of circuits) {
        map.set(circuit.id, refreshCircuit(circuit, prev))
      }
      return { ...prev, circuits: [...map.values()] }
    })
  }, [refreshCircuit])

  const createCircuit = useCallback((projectId: string, name = ''): Circuit => {
    const circuit: Circuit = {
      id: createId(),
      projectId,
      name,
      category: 'lighting',
      loads: [],
      installation: { systemPhase: 'single-phase' },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    upsertCircuit(circuit)
    return circuit
  }, [upsertCircuit])

  const duplicateCircuit = useCallback((id: string): Circuit | undefined => {
    let copy: Circuit | undefined
    setData((prev) => {
      const source = prev.circuits.find((item) => item.id === id)
      if (!source) return prev
      const timestamp = nowIso()
      const suffix = locale === 'pt' ? ' (cópia)' : ' (copy)'
      copy = {
        ...structuredClone(source),
        id: createId(),
        name: `${source.name}`.trim() ? `${source.name}${suffix}` : source.name,
        code: source.code ? `${source.code}-copy` : undefined,
        linkedCableRunId: undefined,
        loads: source.loads.map((load) => ({ ...load, id: createId() })),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const next = refreshCircuit(copy, prev)
      copy = next
      return { ...prev, circuits: [...prev.circuits, next] }
    })
    return copy
  }, [refreshCircuit, locale])

  const upsertLoadType = useCallback((loadType: LoadType) => {
    setData((prev) => {
      const exists = prev.loadTypes.some((item) => item.id === loadType.id)
      const loadTypes = exists
        ? prev.loadTypes.map((item) => (item.id === loadType.id ? loadType : item))
        : [...prev.loadTypes, loadType]
      return { ...prev, loadTypes }
    })
  }, [])

  const deleteLoadType = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      loadTypes: prev.loadTypes.filter((item) => item.id !== id),
    }))
  }, [])

  const setLoadTypes = useCallback((loadTypes: LoadType[]) => {
    setData((prev) => ({ ...prev, loadTypes }))
  }, [])

  const upsertElectricalRuleSet = useCallback((ruleSet: ElectricalRuleSet) => {
    setData((prev) => {
      const exists = prev.electricalRuleSets.some((item) => item.id === ruleSet.id)
      const electricalRuleSets = exists
        ? prev.electricalRuleSets.map((item) => (item.id === ruleSet.id ? ruleSet : item))
        : [...prev.electricalRuleSets, ruleSet]
      const snapshot = { ...prev, electricalRuleSets }
      return {
        ...snapshot,
        circuits: prev.circuits.map((circuit) => refreshCircuit(circuit, snapshot)),
      }
    })
  }, [refreshCircuit])

  const setElectricalRuleSets = useCallback((electricalRuleSets: ElectricalRuleSet[]) => {
    setData((prev) => {
      const snapshot = { ...prev, electricalRuleSets }
      return {
        ...snapshot,
        circuits: prev.circuits.map((circuit) => refreshCircuit(circuit, snapshot)),
      }
    })
  }, [refreshCircuit])

  const activeRuleSet = useMemo(
    () => data.electricalRuleSets.find((item) => item.active) ?? data.electricalRuleSets[0],
    [data.electricalRuleSets],
  )

  const updateCompanySettings = useCallback((patch: Partial<CompanySettings>) => {
    setData((prev) => ({
      ...prev,
      companySettings: { ...prev.companySettings, ...patch },
      quoteNumberState: patch.quotePrefix
        ? { ...prev.quoteNumberState, prefix: patch.quotePrefix }
        : prev.quoteNumberState,
    }))
  }, [])

  const importCompanySettings = useCallback(
    (settings: CompanySettings, quoteNumberState?: QuoteNumberState) => {
      setData((prev) => ({
        ...prev,
        companySettings: { ...prev.companySettings, ...settings },
        quoteNumberState: quoteNumberState
          ? quoteNumberState
          : settings.quotePrefix
            ? { ...prev.quoteNumberState, prefix: settings.quotePrefix }
            : prev.quoteNumberState,
      }))
    },
    [],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      theme,
      locale,
      setTheme,
      setLocale,
      setActiveProjectId,
      replaceAppData,
      projects,
      activeProject,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      importProject,
      importProjectRecords,
      materials: data.materials,
      upsertMaterial,
      deleteMaterial,
      setMaterials,
      suppliers: data.suppliers,
      upsertSupplier,
      deleteSupplier,
      setSuppliers,
      quotes: data.quotes,
      upsertQuote,
      deleteQuote,
      createQuote,
      importQuotes,
      circuits: data.circuits,
      upsertCircuit,
      deleteCircuit,
      importCircuits,
      createCircuit,
      duplicateCircuit,
      loadTypes: data.loadTypes,
      upsertLoadType,
      deleteLoadType,
      setLoadTypes,
      electricalRuleSets: data.electricalRuleSets,
      upsertElectricalRuleSet,
      setElectricalRuleSets,
      activeRuleSet,
      companySettings: data.companySettings,
      updateCompanySettings,
      importCompanySettings,
    }),
    [
      data,
      theme,
      locale,
      setTheme,
      setLocale,
      setActiveProjectId,
      replaceAppData,
      projects,
      activeProject,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      importProject,
      importProjectRecords,
      upsertMaterial,
      deleteMaterial,
      setMaterials,
      upsertSupplier,
      deleteSupplier,
      setSuppliers,
      upsertQuote,
      deleteQuote,
      createQuote,
      importQuotes,
      upsertCircuit,
      deleteCircuit,
      importCircuits,
      createCircuit,
      duplicateCircuit,
      upsertLoadType,
      deleteLoadType,
      setLoadTypes,
      upsertElectricalRuleSet,
      setElectricalRuleSets,
      activeRuleSet,
      updateCompanySettings,
      importCompanySettings,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}

export function createEmptyMaterial(
  overrides?: Partial<Material>,
): Material {
  const now = nowIso()
  return {
    id: createId(),
    name: '',
    category: 'other' as MaterialCategory,
    unit: 'unit' as MaterialUnit,
    purchasePrice: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createEmptySupplier(overrides?: Partial<Supplier>): Supplier {
  const now = nowIso()
  return {
    id: createId(),
    name: '',
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createEmptyQuote(
  number: string,
  settings: CompanySettings,
  projectId?: string,
): Quote {
  const now = nowIso()
  const today = now.slice(0, 10)
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  return {
    id: createId(),
    number,
    projectId,
    client: { name: '' },
    date: today,
    validUntil: validUntil.toISOString().slice(0, 10),
    status: 'draft',
    items: [],
    labor: [],
    globalMarginPercent: settings.defaultMargin,
    taxRate: settings.defaultTaxRate,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyLoadType(overrides?: Partial<LoadType>): LoadType {
  const now = nowIso()
  return {
    id: createId(),
    name: '',
    category: 'other',
    defaultUnitPower: 0,
    unit: 'unit',
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
