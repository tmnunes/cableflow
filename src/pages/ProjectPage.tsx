import { AppHeader } from '@/components/layout/AppHeader'
import { CableRunsTable } from '@/components/project/CableRunsTable'
import { StatsCards } from '@/components/summary/StatsCards'
import { SummaryPanel } from '@/components/summary/SummaryPanel'
import { useProject } from '@/hooks/useProject'

export function ProjectPage() {
  const {
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
    canUndo,
    canClear,
    duplicateRun,
    exportProject,
    printProject,
    triggerImport,
    onFileSelected,
    fileInputRef,
    projectNameInputRef,
  } = useProject()

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden no-print">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <AppHeader
        projectName={project.projectName}
        onProjectNameChange={setProjectName}
        projectNameInputRef={projectNameInputRef}
        theme={theme}
        onThemeChange={setTheme}
        locale={locale}
        onLocaleChange={setLocale}
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

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6 sm:py-6">
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
      </main>
    </div>
  )
}
