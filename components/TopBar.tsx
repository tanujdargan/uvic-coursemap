'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export default function TopBar() {
  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center w-full">
      <div className="text-xl font-bold">CourseMap</div>
      <div className="flex space-x-4">
        <Button asChild variant="ghost">
          <Link href="/explore">Explore Courses</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/scheduler">Timetable</Link>
        </Button>
        <Button asChild variant="ghost" size="icon">
          <a href="https://github.com/TanujDargan/uvic-course-explorer" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
