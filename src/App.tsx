import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProjectPage } from '@/pages/ProjectPage'

export function App() {
  return (
    <TooltipProvider delayDuration={250}>
      <ProjectPage />
      <Toaster richColors position="bottom-right" closeButton />
      <Analytics />
    </TooltipProvider>
  )
}
