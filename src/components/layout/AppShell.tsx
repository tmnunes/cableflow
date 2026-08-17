import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function AppShell() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen">
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

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-border/80 bg-background/80 backdrop-blur-md lg:block no-print">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('nav.closeMenu')}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-background shadow-xl">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur-md lg:hidden no-print">
          <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <span className="text-sm font-semibold text-primary">{t('app.name')}</span>
        </header>

        <TopBar />

        <main className={cn('mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
