import { NavLink, useLocation } from 'react-router-dom'
import {
  Bolt,
  Cable,
  Coffee,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  FolderKanban,
  BookOpen,
  Scale,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppData } from '@/hooks/useAppData'
import { getKofiUrl } from '@/config/donate'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' as const },
  { to: '/projects', icon: FolderKanban, labelKey: 'nav.projects' as const },
  { to: '/cables', icon: Cable, labelKey: 'nav.cables' as const, dynamic: true },
  { to: '/circuits', icon: Bolt, labelKey: 'nav.circuits' as const, dynamic: true },
  { to: '/materials', icon: Package, labelKey: 'nav.materials' as const },
  { to: '/load-types', icon: BookOpen, labelKey: 'nav.loadTypes' as const },
  { to: '/suppliers', icon: Truck, labelKey: 'nav.suppliers' as const },
  { to: '/quotes', icon: FileText, labelKey: 'nav.quotes' as const },
  { to: '/electrical-rules', icon: Scale, labelKey: 'nav.electricalRules' as const },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
]

interface SidebarProps {
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const { t } = useTranslation()
  const { activeProject } = useAppData()
  const location = useLocation()
  const kofiUrl = getKofiUrl()

  const cablesPath = activeProject
    ? `/projects/${activeProject.id}/cables?tab=cables`
    : '/projects'
  const circuitsPath = activeProject
    ? `/projects/${activeProject.id}/cables?tab=circuits`
    : '/projects'

  return (
    <nav className={cn('flex h-full flex-col gap-1 p-3', className)}>
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('app.name')}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t('app.tagline')}</p>
      </div>

      {navItems.map(({ to, icon: Icon, labelKey, dynamic }) => {
        const path = to === '/circuits' ? circuitsPath : dynamic ? cablesPath : to
        const tab = new URLSearchParams(location.search).get('tab')
        const onProjectWorkspace = /\/projects\/[^/]+\/cables\/?$/.test(location.pathname)
        const active =
          to === '/circuits'
            ? onProjectWorkspace && (tab === 'circuits' || tab === 'panel')
            : to === '/cables'
              ? onProjectWorkspace && tab === 'cables'
              : to === '/projects'
                ? location.pathname === '/projects'
                : location.pathname === to || location.pathname.startsWith(`${to}/`)
        return (
          <NavLink
            key={to}
            to={path}
            onClick={onNavigate}
            className={() =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </NavLink>
        )
      })}

      {kofiUrl ? (
        <a
          href={kofiUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Coffee className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{t('nav.support')}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </a>
      ) : null}
    </nav>
  )
}
