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
import TopBar from '@/components/TopBar';
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

export default function ExplorePage() {
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [terms, setTerms] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [isTabActive, setIsTabActive] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "Stop Slacking!";
        setIsTabActive(false);
      } else {
        document.title = "Explore Courses";
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
      uniqueTerms.sort();
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
  const searchWords = searchTerm.toLowerCase().split(' ').filter(Boolean);

  const filteredCourses = groupedCourses.filter((course) => {
    const courseString = `${course.subject} ${course.course_number} ${course.course_name}`.toLowerCase();
    const matchesSearch = searchWords.every((word) => courseString.includes(word));
    const matchesTerm = selectedTerm
      ? course.sections.some((section) => section.term === parseInt(selectedTerm))
      : true;
    return matchesSearch && matchesTerm;
  });

  const subjectIdsWithMatchingCourses = new Set(filteredCourses.map((course) => course.subject));

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectIdsWithMatchingCourses.has(subject.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-100 text-white">
        <div className="w-2/3">
          <p className="mb-4 text-center text-xl">Loading courses...</p>
          <Progress value={progressValue} className="w-full bg-surface-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-100 text-white">
    <TopBar
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTopBarVisible={isTopBarVisible} // Pass the prop
      />
      <div className="border-b border-white-800 mt-16"></div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white-800 flex flex-col">
          <div className="p-4 border-b border-white-800">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-white-400" />
              <Input
                type="search"
                placeholder="Search courses or subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-surface-200 border-white-700 text-white"
              />
            </div>
            <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
              <SelectTrigger className="w-full bg-surface-200 border-white-700 text-white">
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
            <Accordion type="single" collapsible className="w-full">
              {filteredSubjects.map((subject) => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-white-300 hover:text-white">
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
                          className="w-full justify-start px-4 py-2 text-sm text-white-300 hover:text-white"
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
        {/* Main Content */}
        <div className="w-2/3 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {selectedCourse ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {selectedCourse.subject} {selectedCourse.course_number}: {selectedCourse.course_name}
                </h2>
                {/* Display sections using Cards */}
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
                    <div key={type} className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">{type}s</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sectionsOfType.map((section, index) => (
                          <Card
                            key={index}
                            className="mb-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg text-white"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <CardHeader className="flex items-center">
                              <div className="flex flex-col">
                                <p className="text-lg font-semibold">
                                  Section: {section.section}
                                </p>
                                <p className="text-sm text-white-300">
                                  CRN: {section.crn} | Units: {section.units}
                                </p>
                             </div>
                            </CardHeader>
                            <Divider />
                            <CardBody className="flex flex-wrap">
                              <div className="w-1/2">
                                <p>
                                  <strong>Instructor:</strong> {section.instructor}
                                </p>
                                <p>
                                  <strong>Method:</strong> {section.instructional_method}
                                </p>
                                <p>
                                  <strong>Time:</strong> {section.time}
                                </p>
                              </div>
                              <div className="w-1/2">
                                <p>
                                  <strong>Days:</strong> {section.days}
                                </p>
                                <p>
                                  <strong>Location:</strong> {section.location}
                                </p>
                                <p>
                                  <strong>Date Range:</strong> {section.date_range}
                                </p>
                              </div>
                            </CardBody>
                            <Divider />
                            <CardFooter>
                              <p className="text-sm text-white-300">
                                Term: {convertTermToString(section.term)}
                              </p>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white-500 text-xl">Select a course to view details</p>
              </div>
            )}
          </div>
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