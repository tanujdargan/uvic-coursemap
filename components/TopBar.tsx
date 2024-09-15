'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-white p-4 flex justify-between items-center w-full">
      <Link href="/" className="text-xl font-bold">CourseMap</Link>
      <div className="flex space-x-4">
        <Button asChild variant="ghost" className="text-lg font-bold">
          <Link href="/explore">Explore Courses</Link>
        </Button>
        <Button asChild variant="ghost" className="text-lg font-bold">
          <Link href="/scheduler">Timetable</Link>
        </Button>
        <Button asChild variant="ghost" size="icon">
          <a href="https://github.com/TanujDargan/uvic-coursemap" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
