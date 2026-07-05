// layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://uvic-coursemap.vercel.app'),
  title: {
    default: 'UVic CourseMap',
    template: '%s · UVic CourseMap',
  },
  description:
    'Plan your UVic timetable. Explore the full course catalog, build conflict-free schedules, and check live seat availability and professor ratings — all in one place.',
  keywords: [
    'UVic',
    'University of Victoria',
    'course catalog',
    'timetable',
    'schedule builder',
    'seat availability',
    'RateMyProfessor',
  ],
  authors: [{ name: 'Tanuj Dargan', url: 'https://github.com/TanujDargan' }],
  openGraph: {
    title: 'UVic CourseMap',
    description:
      'Explore the UVic course catalog, build conflict-free timetables, and check live seat availability.',
    url: 'https://uvic-coursemap.vercel.app',
    siteName: 'UVic CourseMap',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UVic CourseMap',
    description:
      'Explore the UVic course catalog, build conflict-free timetables, and check live seat availability.',
  },
};

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default AppLayout;
