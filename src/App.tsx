import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/AppRouter'
import { AppDataProvider } from '@/hooks/useAppData'

export function App() {
  return (
    <TooltipProvider delayDuration={250}>
      <AppDataProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppDataProvider>
      <Toaster richColors position="bottom-right" closeButton />
      <Analytics />
    </TooltipProvider>
  )
}
