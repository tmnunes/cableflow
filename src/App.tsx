import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppProviders } from '@/components/providers/AppProviders'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/AppRouter'

export function App() {
  return (
    <TooltipProvider delayDuration={250}>
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
      <Toaster richColors position="bottom-right" closeButton />
      <Analytics />
    </TooltipProvider>
  )
}
