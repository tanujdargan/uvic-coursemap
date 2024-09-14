import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UVIC Course Explorer',
  description: 'Explore courses and create timetables for your semester at UVIC',
}

function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, 'min-h-screen bg-gray-900 text-white')}>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}

export default AppLayout
