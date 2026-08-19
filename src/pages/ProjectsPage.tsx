import { useState } from 'react'
import { Copy, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTransferRow } from '@/components/common/DataTransferRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppData } from '@/hooks/useAppData'
import {
  parseProjectsQuotesImport,
  toProjectsQuotesTransfer,
} from '@/services/importExport'
import { downloadJson } from '@/utils/cn'

export function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    projects,
    quotes,
    createProject,
    deleteProject,
    duplicateProject,
    importProjectRecords,
    importQuotes,
    setActiveProjectId,
  } = useAppData()
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) =>
    p.projectName.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const handleNew = () => {
    const project = createProject('')
    navigate(`/projects/${project.id}/cables`)
  }

  const handleOpen = (id: string) => {
    setActiveProjectId(id)
    navigate(`/projects/${id}/cables`)
  }

  const handleProjectsQuotesExport = () => {
    downloadJson('cableflow-projects-quotes.json', toProjectsQuotesTransfer(projects, quotes))
    toast.success(t('projects.projectsQuotesExported'))
  }

  const handleProjectsQuotesImport = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = parseProjectsQuotesImport(text)
    if (!result.ok) {
      toast.error(t('toast.importFailed', { reason: t(`importErrors.${result.error}`) }))
      return
    }
    importProjectRecords(result.data.projects)
    importQuotes(result.data.quotes)
    const firstProject = result.data.projects[0]
    if (firstProject) {
      setActiveProjectId(firstProject.id)
      navigate(`/projects/${firstProject.id}/cables`)
    }
    toast.success(t('projects.projectsQuotesImported'))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('projects.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('projects.subtitle')}</p>
        </div>
        <Button onClick={handleNew}>
          <Plus />
          {t('projects.new')}
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('projects.dataTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('projects.dataDescription')}</p>
          <div className="divide-y divide-border">
            <DataTransferRow
              title={t('projects.projectsQuotesData')}
              description={t('projects.projectsQuotesDataHint')}
              onExport={handleProjectsQuotesExport}
              onImport={handleProjectsQuotesImport}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('projects.list')}</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('projects.search')}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('projects.empty')}</p>
          ) : (
            filtered.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/projects/${project.id}/cables`}
                    onClick={() => setActiveProjectId(project.id)}
                    className="font-medium hover:text-primary"
                  >
                    {project.projectName || t('projects.unnamed')}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t('projects.runsCount', { count: project.items.length })}
                    {(project.materials?.length ?? 0) > 0 && (
                      <> · {t('projects.materialsCount', { count: project.materials!.length })}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleOpen(project.id)}>
                    {t('projects.open')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const copy = duplicateProject(project.id)
                      if (copy) navigate(`/projects/${copy.id}/cables`)
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(t('projects.deleteConfirm'))) {
                        deleteProject(project.id)
                        toast.success(t('projects.deleted'))
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
