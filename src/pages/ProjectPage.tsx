import { Link, Navigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { CableRunsTable } from '@/components/project/CableRunsTable'
import { StatsCards } from '@/components/summary/StatsCards'
import { SummaryPanel } from '@/components/summary/SummaryPanel'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/hooks/useAppData'
import { useProject } from '@/hooks/useProject'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, locale } = useAppData()

  if (!projectId || !projects.some((p) => p.id === projectId)) {
    return <Navigate to="/projects" replace />
  }

  return <ProjectCablesView projectId={projectId} locale={locale} />
}

function ProjectCablesView({
  projectId,
  locale,
}: {
  projectId: string
  locale: string
}) {
  const { t } = useTranslation()
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
    exportProject,
    printProject,
    triggerImport,
    onFileSelected,
    fileInputRef,
    projectNameInputRef,
  } = useProject(projectId)

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button variant="outline" asChild>
          <Link to={`/quotes/from-project/${projectId}`}>
            <FileText className="h-4 w-4" />
            {t('quotes.fromProject.createFromProject')}
          </Link>
        </Button>
      </div>

      <AppHeader
        projectName={project.projectName}
        onProjectNameChange={setProjectName}
        projectNameInputRef={projectNameInputRef}
        onImport={triggerImport}
        onExport={exportProject}
        onPrint={printProject}
        onClearAll={clearAll}
        canClear={canClear}
        onUndo={undoDelete}
        canUndo={canUndo}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void onFileSelected(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />

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
    </div>
  )
}
