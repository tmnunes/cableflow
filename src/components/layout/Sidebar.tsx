import { NavLink } from 'react-router-dom'
import {
  Cable,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  FolderKanban,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppData } from '@/hooks/useAppData'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' as const },
  { to: '/projects', icon: FolderKanban, labelKey: 'nav.projects' as const },
  { to: '/cables', icon: Cable, labelKey: 'nav.cables' as const, dynamic: true },
  { to: '/materials', icon: Package, labelKey: 'nav.materials' as const },
  { to: '/suppliers', icon: Truck, labelKey: 'nav.suppliers' as const },
  { to: '/quotes', icon: FileText, labelKey: 'nav.quotes' as const },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
]

interface SidebarProps {
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const { t } = useTranslation()
  const { activeProject } = useAppData()

  const cablesPath = activeProject
    ? `/projects/${activeProject.id}/cables`
    : '/projects'

  return (
    <nav className={cn('flex flex-col gap-1 p-3', className)}>
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('app.name')}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t('app.tagline')}</p>
      </div>

      {navItems.map(({ to, icon: Icon, labelKey, dynamic }) => {
        const path = dynamic ? cablesPath : to
        return (
          <NavLink
            key={to}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
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
    </nav>
  )
}
