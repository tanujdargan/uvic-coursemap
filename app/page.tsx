import Link from 'next/link'
import { Button } from '@/components/ui/button'
import AnimatedBackground from '../components/animated-background'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <AnimatedBackground />
      </div>
      <div className="z-10 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          Explore courses and create timetables for your semester at UVIC
        </h1>
        <div className="space-x-4">
          <Button asChild variant="secondary">
            <Link href="/explore">Explore Courses</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/scheduler">Create Timetable</Link>
          </Button>
        </div>
        <p className="mt-8 text-white">
          Built by{' '}
          <a
            href="https://github.com/TanujDargan"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @TanujDargan
          </a>
        </p>
      </div>
    </div>
  )
}
