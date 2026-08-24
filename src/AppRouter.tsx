import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAppData } from '@/hooks/useAppData'
import { DashboardPage } from '@/pages/DashboardPage'
import { ElectricalRulesPage } from '@/pages/ElectricalRulesPage'
import { LoadTypesPage } from '@/pages/LoadTypesPage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { ProjectPage } from '@/pages/ProjectPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { QuoteEditorPage } from '@/pages/QuoteEditorPage'
import { QuoteFromProjectPage } from '@/pages/QuoteFromProjectPage'
import { QuotesPage } from '@/pages/QuotesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SuppliersPage } from '@/pages/SuppliersPage'

function CablesRedirect() {
  const { activeProject } = useAppData()
  if (activeProject) {
    return <Navigate to={`/projects/${activeProject.id}/cables`} replace />
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

export function AppRouter() {
  return (
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
      </Route>
    </Routes>
  )
}
