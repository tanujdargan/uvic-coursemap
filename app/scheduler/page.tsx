'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
} from '@nextui-org/react';
// Replaced SlideTabs with TopBar
import TopBar from '../../components/TopBar';
// Import Calendar component (assuming it exists)
import { Calendar as BaseCalendar } from '@/components/ui/calendar';
import { ComponentProps } from 'react';

// Define a new Calendar type that includes selectedSections
type CalendarProps = ComponentProps<typeof BaseCalendar> & { selectedSections?: Section[] };
const Calendar = BaseCalendar as React.FC<CalendarProps>;

interface Section {
  term: number;
  subject: string;
  course_name: string;
  course_number: number;
  crn: number;
  section: string;
  frequency: string;
  time: string;
  days: string;
  location: string;
  date_range: string;
  schedule_type: string;
  instructor: string;
  instructional_method: string;
  units: number;
}

interface Course {
  subject: string;
  course_number: number;
  course_name: string;
  sections: Section[];
}

interface Subject {
  id: string;
  name: string;
}

export default function ScheduleBuilderPage() {
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [terms, setTerms] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);

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

      // Extract unique subjects and sort them alphabetically
      const uniqueSubjects = Array.from(new Set(grouped.map((course) => course.subject)));
      uniqueSubjects.sort();

      setSubjects(
        uniqueSubjects.map((subject) => ({
          id: subject,
          name: subject,
        }))
      );

      // Extract unique terms
      const uniqueTerms = Array.from(new Set(data.map((section) => section.term)));
      uniqueTerms.sort((a, b) => b - a);

      setTerms(uniqueTerms);

      // Set the default selected term to the first available term
      setSelectedTerm(uniqueTerms[0]?.toString() || '');
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle course click
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
  };

  // Handle section selection
  const handleSectionToggle = (section: Section) => {
    setSelectedSections((prevSelected) => {
      // Check if the section is already selected
      const isSelected = prevSelected.some((s) => s.crn === section.crn);
      if (isSelected) {
        // Remove the section
        return prevSelected.filter((s) => s.crn !== section.crn);
      } else {
        // Add the section
        return [...prevSelected, section];
      }
    });
  };

  // Loading animation for progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 100 ? 0 : prev + 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Search and filter logic
  const searchWords = (searchTerm || '').toLowerCase().split(' ').filter(Boolean);

  const filteredCourses = groupedCourses.filter((course) => {
    const courseString = `${course.subject || ''} ${course.course_number || ''} ${course.course_name || ''}`.toLowerCase();
    const matchesSearch = searchWords.every((word) => courseString.includes(word));
    const matchesTerm = selectedTerm
      ? course.sections.some((section) => section.term === parseInt(selectedTerm))
      : true;
    return matchesSearch && matchesTerm;
  });

  const subjectIdsWithMatchingCourses = new Set(filteredCourses.map((course) => course.subject));

  const filteredSubjects = subjects.filter(
    (subject) =>
      (subject.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      subjectIdsWithMatchingCourses.has(subject.id)
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
      <div className="border-b border-gray-800 mt-16"></div> {/* Separator line */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/4 border-r border-gray-800 flex flex-col">
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
            <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term} value={term.toString()}>
                    {convertTermToString(term)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="multiple" className="w-full">
              {filteredSubjects.map((subject) => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-gray-300 hover:text-white">
                    {subject.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    {filteredCourses
                      .filter((course) => course.subject === subject.id)
                      .sort((a, b) => a.course_number - b.course_number)
                      .map((course) => (
                        <Button
                          key={`${course.subject}-${course.course_number}`}
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-gray-300 hover:text-white"
                          onClick={() => handleCourseClick(course)}
                        >
                          {course.subject} {course.course_number}: {course.course_name}
                        </Button>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
        {/* Center - Calendar */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Calendar Component */}
            <Calendar selectedSections={selectedSections} />
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="w-1/4 border-l border-gray-800 p-4">
          {selectedCourse ? (
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedCourse.subject} {selectedCourse.course_number}
              </h2>
              <p className="mb-4">{selectedCourse.course_name}</p>
              <ScrollArea className="flex-1">
                {['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'].map((type) => {
                  const sectionsOfType = selectedCourse.sections
                    .filter(
                      (section) =>
                        section.schedule_type === type &&
                        (selectedTerm ? section.term === parseInt(selectedTerm) : true)
                    )
                    .sort((a, b) => a.section.localeCompare(b.section));

                  if (sectionsOfType.length === 0) return null;

                  return (
                    <div key={type} className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">{type}s</h3>
                      {sectionsOfType.map((section, index) => {
                        const isSelected = selectedSections.some((s) => s.crn === section.crn);
                        return (
                          <div key={index} className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSectionToggle(section)}
                              className="mr-2"
                            />
                            <label className="flex-1">
                              Section {section.section} - {section.days} {section.time}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xl">Select a course to view sections</p>
            </div>
          )}
        </div>
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

// Helper function to convert term codes to strings
function convertTermToString(termCode: number): string {
  const termStr = termCode.toString();
  const year = termStr.substring(0, 4);
  const semesterCode = termStr.substring(4);
  let semester = '';

  switch (semesterCode) {
    case '01':
      semester = 'Spring';
      break;
    case '05':
      semester = 'Summer';
      break;
    case '09':
      semester = 'Fall';
      break;
    default:
      semester = 'Unknown';
  }

  return `${semester} ${year}`;
}