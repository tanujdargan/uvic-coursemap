'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import TopBar from '@/components/TopBar'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7) // 7 AM to 11 PM

export default function Scheduler() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()
      setCourses(data)
      
      // Extract unique subjects
      const uniqueSubjects = Array.from(new Set(data.map(course => course.subject)))
      setSubjects(uniqueSubjects.map(subject => ({
        id: subject,
        name: data.find(course => course.subject === subject)?.subjectName || ''
      })))
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleCourseClick = (course) => {
    const hasConflict = selectedCourses.some((selectedCourse) => {
      return selectedCourse.time === course.time
    })

    if (!hasConflict) {
      setSelectedCourses([...selectedCourses, course])
      toast({
        title: 'Course Added',
        description: `${course.subject} ${course.number} has been added to your schedule.`,
      })
    } else {
      toast({
        title: 'Time Conflict',
        description: 'This course conflicts with your existing schedule.',
        variant: 'destructive',
      })
    }
  }

  const removeCourse = (courseId) => {
    setSelectedCourses(selectedCourses.filter(course => course.id !== courseId))
    toast({
      title: 'Course Removed',
      description: 'The course has been removed from your schedule.',
    })
  }

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="single" collapsible className="w-full">
              {filteredSubjects.map((subject) => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-gray-300 hover:text-white">
                    {subject.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    {courses
                      .filter((course) => course.subject === subject.id)
                      .map((course) => (
                        <Button
                          key={course.id}
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-gray-300 hover:text-white"
                          onClick={() => handleCourseClick(course)}
                        >
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 bg-${course.color}-600`} />
                            <span>{course.subject} {course.number}: {course.title}</span>
                          </div>
                        </Button>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
        <main className="flex-1 p-6 overflow-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">September 2024</div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-px bg-gray-700">
                <div></div>
                {weekDays.map((day) => (
                  <div key={day} className="font-semibold text-center py-2 bg-gray-800">{day}</div>
                ))}
                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    <div className="text-right pr-2 py-2 text-sm text-gray-400 bg-gray-800">{`${time}:00`}</div>
                    {weekDays.map((day) => (
                      <div key={`${day}-${time}`} className="bg-gray-800 relative">
                        {selectedCourses.map((course) => {
                          if (course.time.includes(day[0]) && course.time.includes(`${time}:`)) {
                            return (
                              <div key={course.id} className={`absolute inset-0 m-px bg-${course.color}-600 bg-opacity-20 p-1 text-xs overflow-hidden`}>
                                <div className="font-semibold">{course.subject} {course.number}</div>
                                <div className="text-gray-300 truncate">{course.title}</div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}