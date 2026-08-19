import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type {
  CableRun,
  ConductorCode,
  Material,
  Project,
  ProjectMaterialItem,
  SortDirection,
  SortField,
} from '@/types'
import { cableMaterialSourceKey } from '@/types'
import { PROJECT_VERSION } from '@/data/circuits'
import { useAppData } from '@/hooks/useAppData'
import { calculateProjectSummary } from '@/utils/calculations'
import { createId } from '@/utils/cn'
import { catalogPriceForLine } from '@/utils/pricing/catalogLine'

const CONDUCTOR_LABELS: Record<ConductorCode, string> = {
  F: 'Phase (F)',
  R: 'Return (R)',
  VJ: 'Traveller (VJ)',
  N: 'Neutral (N)',
  T: 'Earth (T)',
}

function buildCableMaterials(
  summary: ReturnType<typeof calculateProjectSummary>,
  existing: ProjectMaterialItem[],
  tFn: (key: string, opts?: Record<string, unknown>) => string,
): ProjectMaterialItem[] {
  const byKey = new Map(
    existing.filter((m) => m.cableSourceKey).map((m) => [m.cableSourceKey!, m]),
  )
  const cableItems: ProjectMaterialItem[] = []

  for (const section of summary.bySection) {
    for (const cond of section.conductors) {
      const key = cableMaterialSourceKey(section.sectionMm2, cond.code)
      const prev = byKey.get(key)
      if (prev) {
        cableItems.push({ ...prev, quantity: cond.meters })
        continue
      }

      const label = CONDUCTOR_LABELS[cond.code] ?? cond.code
      cableItems.push({
        id: createId(),
        description: tFn('projectMaterials.cableAutoDescription', {
          section: section.sectionMm2,
          conductor: label,
        }),
        quantity: cond.meters,
        unit: 'meter',
        unitPrice: 0,
        notes: '',
        cableSourceKey: key,
      })
    }
  }

  const manualItems = existing.filter((m) => !m.cableSourceKey)
  return [...cableItems, ...manualItems]
}

function createEmptyRun(): CableRun {
  return {
    id: createId(),
    description: '',
    distance: 1,
    type: 'I',
    conduit: Number.NaN,
    spec: '',
    notes: '',
  }
}

export function useProject(projectId: string) {
  const { t } = useTranslation()
  const { projects, updateProject } = useAppData()
  const projectRecord = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  )

  const project: Project = useMemo(
    () =>
      projectRecord ?? {
        projectName: '',
        version: PROJECT_VERSION,
        items: [],
      },
    [projectRecord],
  )

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('description')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deletedStack, setDeletedStack] = useState<CableRun[]>([])
  const projectNameInputRef = useRef<HTMLInputElement | null>(null)

  const summary = useMemo(() => calculateProjectSummary(project), [project])

  const prevSummaryRef = useRef<string>('')
  useEffect(() => {
    const summaryKey = JSON.stringify(summary.bySection)
    if (summaryKey === prevSummaryRef.current) return
    prevSummaryRef.current = summaryKey

    if (
      summary.bySection.length === 0 &&
      !(project.materials ?? []).some((m) => m.cableSourceKey)
    ) {
      return
    }

    const currentMaterials = project.materials ?? []
    const synced = buildCableMaterials(summary, currentMaterials, t)
    const currentKeys = currentMaterials
      .map((m) => `${m.cableSourceKey ?? ''}|${m.id}|${m.quantity}`)
      .join(';')
    const syncedKeys = synced
      .map((m) => `${m.cableSourceKey ?? ''}|${m.id}|${m.quantity}`)
      .join(';')

    if (currentKeys === syncedKeys) return
    updateProject(projectId, { materials: synced })
  }, [summary, project.materials, projectId, t, updateProject])

  const patchProject = useCallback(
    (patch: Partial<Pick<Project, 'projectName' | 'items' | 'materials'>>) => {
      if (!projectRecord) return
      updateProject(projectId, patch)
    },
    [projectId, projectRecord, updateProject],
  )

  const setProjectName = useCallback(
    (projectName: string) => patchProject({ projectName }),
    [patchProject],
  )

  const clearAll = useCallback(() => {
    const hasContent =
      project.items.length > 0 ||
      project.projectName.trim().length > 0 ||
      (project.materials?.length ?? 0) > 0

    if (hasContent && !window.confirm(t('header.clearAllConfirm'))) {
      return
    }

    patchProject({ projectName: '', items: [], materials: [] })
    setDeletedStack([])
    setSearch('')
    toast.success(t('toast.cleared'))
    requestAnimationFrame(() => {
      projectNameInputRef.current?.focus()
      projectNameInputRef.current?.select()
    })
  }, [patchProject, project.items.length, project.materials?.length, project.projectName, t])

  const updateRun = useCallback(
    (id: string, patch: Partial<CableRun>) => {
      patchProject({
        items: project.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      })
    },
    [patchProject, project.items],
  )

  const addRun = useCallback(() => {
    patchProject({ items: [...project.items, createEmptyRun()] })
    toast.success(t('toast.added'))
  }, [patchProject, project.items, t])

  const deleteRun = useCallback(
    (id: string) => {
      const target = project.items.find((item) => item.id === id)
      if (target) {
        setDeletedStack((stack) => [...stack, target])
      }
      patchProject({ items: project.items.filter((item) => item.id !== id) })
      toast.success(t('toast.deleted'))
    },
    [patchProject, project.items, t],
  )

  const undoDelete = useCallback(() => {
    setDeletedStack((stack) => {
      if (stack.length === 0) {
        toast.message(t('toast.nothingToUndo'))
        return stack
      }
      const next = [...stack]
      const restored = next.pop()!
      patchProject({ items: [...project.items, restored] })
      toast.success(t('toast.undone'))
      return next
    })
  }, [patchProject, project.items, t])

  const duplicateRun = useCallback(
    (id: string) => {
      const source = project.items.find((item) => item.id === id)
      if (!source) return
      const copy: CableRun = {
        ...source,
        id: createId(),
        description: `${source.description}${t('toast.copySuffix')}`,
      }
      const index = project.items.findIndex((item) => item.id === id)
      const items = [...project.items]
      items.splice(index + 1, 0, copy)
      patchProject({ items })
      toast.success(t('toast.duplicated'))
    },
    [patchProject, project.items, t],
  )

  const projectMaterials = useMemo(() => project.materials ?? [], [project.materials])

  const addMaterial = useCallback(() => {
    const item: ProjectMaterialItem = {
      id: createId(),
      description: '',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      notes: '',
    }
    patchProject({ materials: [...projectMaterials, item] })
  }, [patchProject, projectMaterials])

  const addMaterialFromCatalog = useCallback(
    (
      catalogMaterial: Pick<
        Material,
        'id' | 'name' | 'unit' | 'purchasePrice' | 'supplierId' | 'metersPerRoll'
      >,
      quantity: number,
    ) => {
      const unit = catalogMaterial.unit === 'roll' && catalogMaterial.metersPerRoll ? 'meter' : catalogMaterial.unit
      const item: ProjectMaterialItem = {
        id: createId(),
        description: catalogMaterial.name,
        quantity,
        unit,
        unitPrice: catalogPriceForLine(catalogMaterial, unit),
        notes: '',
        catalogMaterialId: catalogMaterial.id,
        supplierId: catalogMaterial.supplierId,
      }
      patchProject({ materials: [...projectMaterials, item] })
    },
    [patchProject, projectMaterials],
  )

  const updateMaterial = useCallback(
    (id: string, patch: Partial<ProjectMaterialItem>) => {
      patchProject({
        materials: projectMaterials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      })
    },
    [patchProject, projectMaterials],
  )

  const deleteMaterial = useCallback(
    (id: string) => {
      patchProject({ materials: projectMaterials.filter((m) => m.id !== id) })
    },
    [patchProject, projectMaterials],
  )

  const duplicateMaterial = useCallback(
    (id: string) => {
      const source = projectMaterials.find((m) => m.id === id)
      if (!source) return
      const copy: ProjectMaterialItem = { ...source, id: createId() }
      const index = projectMaterials.findIndex((m) => m.id === id)
      const items = [...projectMaterials]
      items.splice(index + 1, 0, copy)
      patchProject({ materials: items })
    },
    [patchProject, projectMaterials],
  )

  const printProject = useCallback(() => {
    window.print()
  }, [])

  const toggleSort = useCallback((field: SortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'))
        return current
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  const filteredSortedItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    let items = project.items

    if (q) {
      items = items.filter((item) =>
        [item.description, item.conduit, item.spec, item.notes, item.type]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }

    const dir = sortDirection === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const av = getSortValue(a, sortField)
      const bv = getSortValue(b, sortField)
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [project.items, search, sortDirection, sortField])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey
      if (!meta) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        const target = event.target as HTMLElement | null
        const tag = target?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
          return
        }
        event.preventDefault()
        undoDelete()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undoDelete])

  return {
    project,
    summary,
    search,
    setSearch,
    sortField,
    sortDirection,
    toggleSort,
    filteredSortedItems,
    setProjectName,
    clearAll,
    updateRun,
    addRun,
    deleteRun,
    undoDelete,
    canUndo: deletedStack.length > 0,
    canClear:
      project.items.length > 0 ||
      project.projectName.trim().length > 0 ||
      projectMaterials.length > 0,
    duplicateRun,
    printProject,
    projectNameInputRef,
    projectMaterials,
    addMaterial,
    addMaterialFromCatalog,
    updateMaterial,
    deleteMaterial: deleteMaterial as (id: string) => void,
    duplicateMaterial,
  }
}

function getSortValue(run: CableRun, field: SortField): string | number {
  switch (field) {
    case 'description':
      return run.description
    case 'distance':
      return run.distance
    case 'type':
      return run.type
    case 'section': {
      const map: Record<string, number> = { I: 1.5, T: 2.5, P: 4, Q: 10, G: 16 }
      return map[run.type] ?? 0
    }
    case 'conduit':
      return run.conduit
    case 'spec':
      return run.spec
    case 'notes':
      return run.notes
  }
}
