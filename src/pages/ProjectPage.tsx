import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Cable, FileText, Package, Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { CableRunsTable } from '@/components/project/CableRunsTable'
import { ProjectMaterialsTable } from '@/components/project/ProjectMaterialsTable'
import { StatsCards } from '@/components/summary/StatsCards'
import { SummaryPanel } from '@/components/summary/SummaryPanel'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/hooks/useAppData'
import { useProject } from '@/hooks/useProject'

type Tab = 'cables' | 'materials'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, locale } = useAppData()

  if (!projectId || !projects.some((p) => p.id === projectId)) {
    return <Navigate to="/projects" replace />
  }

  return <ProjectView projectId={projectId} locale={locale} />
}

function ProjectView({
  projectId,
  locale,
}: {
  projectId: string
  locale: string
}) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: Tab = requestedTab === 'cables' ? 'cables' : 'materials'

  const {
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
    canUndo,
    canClear,
    duplicateRun,
    printProject,
    projectNameInputRef,
    projectMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    duplicateMaterial,
  } = useProject(projectId)

  const { materials: catalogMaterials, suppliers } = useAppData()

  const setActiveTab = (tab: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'materials') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={printProject}>
            <Printer className="h-4 w-4" />
            {t('header.print')}
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/quotes/from-project/${projectId}`}>
              <FileText className="h-4 w-4" />
              {t('quotes.fromProject.createFromProject')}
            </Link>
          </Button>
        </div>
      </div>

      <AppHeader
        projectName={project.projectName}
        onProjectNameChange={setProjectName}
        projectNameInputRef={projectNameInputRef}
        onClearAll={clearAll}
        canClear={canClear}
        onUndo={undoDelete}
        canUndo={canUndo}
      />

      <div className="flex gap-1 border-b border-border/70 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'materials'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          {t('projects.tabs.materials')}
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
            {projectMaterials.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cables')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cables'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Cable className="h-4 w-4" />
          {t('projects.tabs.cables')}
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
            {project.items.length}
          </span>
        </button>
      </div>

      {activeTab === 'cables' && (
        <>
          <StatsCards totals={summary.totals} locale={locale} />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] print:block print:space-y-3">
            <CableRunsTable
              items={filteredSortedItems}
              search={search}
              onSearchChange={setSearch}
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={toggleSort}
              onUpdate={updateRun}
              onAdd={addRun}
              onDelete={deleteRun}
              onDuplicate={duplicateRun}
              totalCount={project.items.length}
            />
            <SummaryPanel summary={summary} locale={locale} />
          </div>
        </>
      )}

      {activeTab === 'materials' && (
        <ProjectMaterialsTable
          items={projectMaterials}
          onAdd={addMaterial}
          onUpdate={updateMaterial}
          onDelete={deleteMaterial}
          onDuplicate={duplicateMaterial}
          locale={locale}
          catalogMaterials={catalogMaterials}
          suppliers={suppliers}
        />
      )}
    </div>
  )
}
