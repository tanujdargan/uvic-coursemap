'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, Menu } from 'lucide-react'
import { useState } from 'react'

export default function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-white p-4 flex flex-wrap justify-between items-center w-full">
      <Link href="/" className="text-xl font-bold">CourseMap</Link>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto mt-4 md:mt-0`}>
        <Button asChild variant="ghost" className="text-lg font-bold w-full md:w-auto">
          <Link href="/explore">Explore Courses</Link>
        </Button>
        <Button asChild variant="ghost" className="text-lg font-bold w-full md:w-auto">
          <Link href="/scheduler">Timetable</Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="w-full md:w-auto">
          <a href="https://github.com/TanujDargan/uvic-coursemap" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
