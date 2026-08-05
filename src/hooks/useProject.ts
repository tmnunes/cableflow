import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { CableRun, Locale, Project, SortDirection, SortField, Theme } from '@/types'
import { PROJECT_VERSION } from '@/data/circuits'
import { calculateProjectSummary } from '@/utils/calculations'
import { createId, downloadJson, slugifyFilename } from '@/utils/cn'
import { toExportPayload, parseImportJson } from '@/services/importExport'
import {
  loadLocale,
  loadProject,
  loadTheme,
  saveLocale,
  saveProject,
  saveTheme,
} from '@/services/storage'

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

export function useProject() {
  const { t, i18n } = useTranslation()
  const [project, setProject] = useState<Project>(() => loadProject())
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const [locale, setLocale] = useState<Locale>(() => loadLocale())
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('description')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deletedStack, setDeletedStack] = useState<CableRun[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const projectNameInputRef = useRef<HTMLInputElement | null>(null)

  const summary = useMemo(() => calculateProjectSummary(project), [project])

  useEffect(() => {
    saveProject(project)
  }, [project])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    void i18n.changeLanguage(locale)
    saveLocale(locale)
  }, [locale, i18n])

  const resolveImportError = useCallback(
    (error: string): string => {
      if (error.includes(':')) {
        const [key, index] = error.split(':')
        return t(`importErrors.${key}`, { index: Number(index) + 1 })
      }
      return t(`importErrors.${error}`)
    },
    [t],
  )

  const setProjectName = useCallback((projectName: string) => {
    setProject((prev) => ({ ...prev, projectName }))
  }, [])

  const clearAll = useCallback(() => {
    const hasContent = project.items.length > 0 || project.projectName.trim().length > 0
    if (hasContent && !window.confirm(t('header.clearAllConfirm'))) {
      return
    }

    setProject({
      projectName: '',
      version: PROJECT_VERSION,
      items: [],
    })
    setDeletedStack([])
    setSearch('')
    toast.success(t('toast.cleared'))
    requestAnimationFrame(() => {
      projectNameInputRef.current?.focus()
      projectNameInputRef.current?.select()
    })
  }, [project.items.length, project.projectName, t])

  const updateRun = useCallback((id: string, patch: Partial<CableRun>) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }, [])

  const addRun = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyRun()],
    }))
    toast.success(t('toast.added'))
  }, [t])

  const deleteRun = useCallback(
    (id: string) => {
      setProject((prev) => {
        const target = prev.items.find((item) => item.id === id)
        if (target) {
          setDeletedStack((stack) => [...stack, target])
        }
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== id),
        }
      })
      toast.success(t('toast.deleted'))
    },
    [t],
  )

  const undoDelete = useCallback(() => {
    setDeletedStack((stack) => {
      if (stack.length === 0) {
        toast.message(t('toast.nothingToUndo'))
        return stack
      }
      const next = [...stack]
      const restored = next.pop()!
      setProject((prev) => ({
        ...prev,
        items: [...prev.items, restored],
      }))
      toast.success(t('toast.undone'))
      return next
    })
  }, [t])

  const duplicateRun = useCallback(
    (id: string) => {
      setProject((prev) => {
        const source = prev.items.find((item) => item.id === id)
        if (!source) return prev
        const copy: CableRun = {
          ...source,
          id: createId(),
          description: `${source.description}${t('toast.copySuffix')}`,
        }
        const index = prev.items.findIndex((item) => item.id === id)
        const items = [...prev.items]
        items.splice(index + 1, 0, copy)
        return { ...prev, items }
      })
      toast.success(t('toast.duplicated'))
    },
    [t],
  )

  const exportProject = useCallback(() => {
    if (!project.projectName.trim()) {
      toast.error(t('toast.projectNameRequired'))
      projectNameInputRef.current?.focus()
      return
    }
    const payload = toExportPayload(project)
    downloadJson(`${slugifyFilename(project.projectName)}.json`, payload)
    toast.success(t('toast.exported'))
  }, [project, t])

  const printProject = useCallback(() => {
    window.print()
  }, [])

  const importFromText = useCallback(
    (raw: string) => {
      const result = parseImportJson(raw)
      if (!result.ok) {
        toast.error(t('toast.importFailed', { reason: resolveImportError(result.error) }))
        return
      }
      setProject(result.project)
      setDeletedStack([])
      toast.success(t('toast.imported'))
    },
    [resolveImportError, t],
  )

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const onFileSelected = useCallback(
    async (file: File | null) => {
      if (!file) return
      const text = await file.text()
      importFromText(text)
    },
    [importFromText],
  )

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
      if (key === 's') {
        event.preventDefault()
        exportProject()
      } else if (key === 'o') {
        event.preventDefault()
        triggerImport()
      } else if (key === 'z' && !event.shiftKey) {
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
  }, [exportProject, triggerImport, undoDelete])

  return {
    project,
    summary,
    theme,
    setTheme,
    locale,
    setLocale,
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
    canClear: project.items.length > 0 || project.projectName.trim().length > 0,
    duplicateRun,
    exportProject,
    printProject,
    triggerImport,
    onFileSelected,
    fileInputRef,
    projectNameInputRef,
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
