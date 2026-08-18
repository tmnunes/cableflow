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
import type { CompanySettings } from '@/types/company'
import type { Quote } from '@/types/quote'
import { allocateQuoteNumber } from '@/services/quotes/quoteNumber'
import { createProjectRecord } from '@/services/storage/defaultAppData'
import { normalizeQuote } from '@/utils/quotes'
import { createId } from '@/utils/cn'

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
  importProject: (project: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>) => ProjectRecord

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

  // Company
  companySettings: CompanySettings
  updateCompanySettings: (patch: Partial<CompanySettings>) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData())
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
    setData((prev) => ({ ...prev, activeProjectId: id }))
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
      if (nextProjects.length === 0) {
        const fallback = createProjectRecord({ projectName: '', items: [] })
        return {
          ...prev,
          projects: [fallback],
          activeProjectId: fallback.id,
        }
      }
      const nextActive =
        prev.activeProjectId === id ? nextProjects[0]!.id : prev.activeProjectId
      return { ...prev, projects: nextProjects, activeProjectId: nextActive }
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
      return {
        ...prev,
        projects: [...prev.projects, duplicated],
        activeProjectId: duplicated.id,
      }
    })
    return copy
  }, [])

  const importProject = useCallback(
    (project: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectRecord => {
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

  const updateCompanySettings = useCallback((patch: Partial<CompanySettings>) => {
    setData((prev) => ({
      ...prev,
      companySettings: { ...prev.companySettings, ...patch },
      quoteNumberState: patch.quotePrefix
        ? { ...prev.quoteNumberState, prefix: patch.quotePrefix }
        : prev.quoteNumberState,
    }))
  }, [])

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
      companySettings: data.companySettings,
      updateCompanySettings,
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
      upsertMaterial,
      deleteMaterial,
      setMaterials,
      upsertSupplier,
      deleteSupplier,
      setSuppliers,
      upsertQuote,
      deleteQuote,
      createQuote,
      updateCompanySettings,
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
