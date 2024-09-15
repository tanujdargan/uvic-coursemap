// app/scheduler/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TopBar from '@/components/TopBar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface Section {
  term: number;
  subject: string;
  subjectName: string;
  course_number: string;
  course_name: string;
  crn: number;
  section: string;
  time: string;
  days: string;
  location: string;
  schedule_type: string;
  instructor: string;
  units: number;
  color: string; // For display purposes
}

interface Course {
  subject: string;
  subjectName: string;
  course_number: string;
  course_name: string;
  sections: Section[];
}

interface Subject {
  id: string;
  name: string;
}

export default function SchedulerPage() {
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressValue, setProgressValue] = useState<number>(0);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data: Section[] = await response.json();

      // Group sections into courses
      const grouped = groupSectionsIntoCourses(data);
      setGroupedCourses(grouped);

      // Extract unique subjects
      const uniqueSubjects = Array.from(new Set(grouped.map(course => course.subject)));
      uniqueSubjects.sort();

      setSubjects(
        uniqueSubjects.map(subjectId => {
          const subjectName = grouped.find(course => course.subject === subjectId)?.subjectName || '';
          return {
            id: subjectId,
            name: subjectName || subjectId,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading animation for progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgressValue(prev => (prev >= 100 ? 0 : prev + 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSectionClick = (section: Section) => {
    const hasConflict = selectedSections.some(selectedSection => {
      // Check for time conflicts
      return (
        selectedSection.days === section.days &&
        selectedSection.time === section.time &&
        selectedSection.schedule_type === section.schedule_type
      );
    });

    if (!hasConflict) {
      setSelectedSections([...selectedSections, section]);
      toast({
        title: 'Section Added',
        description: `${section.subject} ${section.course_number} - ${section.section} has been added to your schedule.`,
      });
    } else {
      toast({
        title: 'Time Conflict',
        description: 'This section conflicts with your existing schedule.',
        variant: 'destructive',
      });
    }
  };

  const removeSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter(section => section.crn.toString() !== sectionId));
    toast({
      title: 'Section Removed',
      description: 'The section has been removed from your schedule.',
    });
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="w-2/3">
          <p className="mb-4 text-center text-xl">Loading courses...</p>
          <Progress value={progressValue} className="w-full bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-800 flex flex-col mt-16">
          <div className="p-4 border-b border-gray-800">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search courses or subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="single" collapsible className="w-full">
              {filteredSubjects.map(subject => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-gray-300 hover:text-white">
                    {subject.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    {groupedCourses
                      .filter(course => course.subject === subject.id)
                      .sort((a, b) => {
                        // Convert course_number to string if it's not already
                        const aNum = String(a.course_number);
                        const bNum = String(b.course_number);
                        return aNum.localeCompare(bNum);
                      })
                      .map(course => (
                        <div key={`${course.subject}-${course.course_number}`}>
                          <div className="px-4 py-2 text-gray-200 font-semibold">
                            {course.course_number}: {course.course_name}
                          </div>
                          {course.sections.map(section => (
                            <Button
                              key={section.crn}
                              variant="ghost"
                              className="w-full justify-start px-8 py-1 text-sm text-gray-300 hover:text-white"
                              onClick={() => handleSectionClick(section)}
                            >
                              <div className="flex items-center">
                                <span>Section {section.section} - {section.schedule_type}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto mt-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">Schedule</div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-px bg-gray-700">
                <div></div>
                {weekDays.map(day => (
                  <div key={day} className="font-semibold text-center py-2 bg-gray-800">{day}</div>
                ))}
                {timeSlots.map(time => (
                  <React.Fragment key={time}>
                    <div className="text-right pr-2 py-2 text-sm text-gray-400 bg-gray-800">
                      {`${time}:00`}
                    </div>
                    {weekDays.map(day => (
                      <div key={`${day}-${time}`} className="bg-gray-800 relative h-20">
                        {selectedSections.map(section => {
                          // Check if the section should be displayed in this cell
                          const sectionDays = section.days?.split('') || [];
                          const dayInitial = day.charAt(0);
                          const [startTime, endTime] = section.time?.split('-') || [];
                          const sectionStartTime = startTime ? parseInt(startTime.split(':')[0]) : 0;
                          const sectionEndTime = endTime ? parseInt(endTime.split(':')[0]) : 0;

                          if (
                            sectionDays.includes(dayInitial) &&
                            time >= sectionStartTime &&
                            time < sectionEndTime
                          ) {
                            return (
                              <div
                                key={section.crn}
                                className={`absolute inset-0 m-px bg-indigo-600 bg-opacity-70 p-1 text-xs overflow-hidden cursor-pointer`}
                                onClick={() => removeSection(section.crn.toString())}
                              >
                                <div className="font-semibold">
                                  {section.subject} {section.course_number} - {section.section}
                                </div>
                                <div className="text-gray-200 truncate">{section.course_name}</div>
                              </div>
                            );
                          }
                          return null;
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
  );
}

// Helper function to group sections into courses
function groupSectionsIntoCourses(sections: Section[]): Course[] {
  const coursesMap: { [key: string]: Course } = {};

  sections.forEach((section) => {
    const key = `${section.subject}-${section.course_number}`;
    if (!coursesMap[key]) {
      coursesMap[key] = {
        subject: section.subject,
        subjectName: section.subjectName,
        course_number: section.course_number,
        course_name: section.course_name,
        sections: [section],
      };
    } else {
      coursesMap[key].sections.push(section);
    }
  });

  return Object.values(coursesMap);
}