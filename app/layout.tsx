// layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'UVIC CourseMap',
  description: 'Explore courses and create timetables for your semester at UVIC',
};

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Remove the 'dark' class from the html element */}
      <body className={cn(inter.className, 'min-h-screen')}>
        {/* Wrap your app with ThemeProvider */}
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ToastProvider>
            {children}
            <ToastViewport />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default AppLayout;