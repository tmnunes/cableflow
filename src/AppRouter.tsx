import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAppData } from '@/hooks/useAppData'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ElectricalRulesPage = lazy(() =>
  import('@/pages/ElectricalRulesPage').then((m) => ({ default: m.ElectricalRulesPage })),
)
const LoadTypesPage = lazy(() =>
  import('@/pages/LoadTypesPage').then((m) => ({ default: m.LoadTypesPage })),
)
const MaterialsPage = lazy(() =>
  import('@/pages/MaterialsPage').then((m) => ({ default: m.MaterialsPage })),
)
const ProjectPage = lazy(() =>
  import('@/pages/ProjectPage').then((m) => ({ default: m.ProjectPage })),
)
const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
)
const QuoteEditorPage = lazy(() =>
  import('@/pages/QuoteEditorPage').then((m) => ({ default: m.QuoteEditorPage })),
)
const QuoteFromProjectPage = lazy(() =>
  import('@/pages/QuoteFromProjectPage').then((m) => ({ default: m.QuoteFromProjectPage })),
)
const QuotesPage = lazy(() =>
  import('@/pages/QuotesPage').then((m) => ({ default: m.QuotesPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const SuppliersPage = lazy(() =>
  import('@/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
)

function CablesRedirect() {
  const { activeProject } = useAppData()
  if (activeProject) {
    return <Navigate to={`/projects/${activeProject.id}/cables?tab=cables`} replace />
  }
  return <Navigate to="/projects" replace />
}

function CircuitsRedirect() {
  const { activeProject } = useAppData()
  if (activeProject) {
    return <Navigate to={`/projects/${activeProject.id}/cables?tab=circuits`} replace />
  }
  return <Navigate to="/projects" replace />
}

function PrivateRobotsMeta() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
  }, [])
  return null
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      …
    </div>
  )
}

export function AppRouter() {
  return (
    <>
      <PrivateRobotsMeta />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId/cables" element={<ProjectPage />} />
            <Route path="cables" element={<CablesRedirect />} />
            <Route path="circuits" element={<CircuitsRedirect />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="load-types" element={<LoadTypesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="quotes/from-project/:projectId" element={<QuoteFromProjectPage />} />
            <Route path="quotes/:quoteId" element={<QuoteEditorPage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="electrical-rules" element={<ElectricalRulesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
