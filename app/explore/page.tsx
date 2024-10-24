// explore/page.tsx
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
import { IProfessorRating } from '@/utils/rateMyProfessor';
import { motion } from 'framer-motion';

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

interface CourseDetails {
  pid: string;
  courseId: string;
  subjectCode: string;
  title: string;
  description: string;
  credits: number;
  prerequisites?: string;
  recommendations?: string;
  notes?: string;
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
  const [isTopBarVisible, setIsTopBarVisible] = useState<boolean>(true);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

  // State to cache professor ratings
  const [ratingsCache, setRatingsCache] = useState<{ [professorName: string]: IProfessorRating }>({});

  // State to store seat capacity data
  const [seatCapacities, setSeatCapacities] = useState<{ [crn: number]: any }>({});

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = 'Stop Slacking!';
        setIsTabActive(false);
      } else {
        document.title = 'Explore Courses';
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
  useEffect(() => {
    const fetchCourseDetails = async (courseId: string) => {
      try {
        const response = await fetch(`/api/course-details/${encodeURIComponent(courseId)}`);
        if (response.ok) {
          const data: CourseDetails = await response.json();
          setCourseDetails(data);
        } else {
          console.error(`Failed to fetch course details for ${courseId}: ${response.statusText}`);
          setCourseDetails(null);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
        setCourseDetails(null);
      }
    };
  
    if (selectedCourse) {
      const courseId = `${selectedCourse.subject}${selectedCourse.course_number}`;
      fetchCourseDetails(courseId);
    } else {
      setCourseDetails(null);
    }
  }, [selectedCourse]);  

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

  // Add useEffect to handle isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    // Event listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch professor ratings when selectedCourse changes
  useEffect(() => {
    const fetchRatingsForSelectedCourse = async () => {
      if (!selectedCourse) return;

      const instructorNames = new Set<string>();
      selectedCourse.sections.forEach((section) => {
        const instructorName = section.instructor.trim();
        if (instructorName && instructorName !== '' && instructorName !== 'TBA') {
          instructorNames.add(instructorName);
        } else if (instructorName === 'TBA') {
          // Set default value for TBA
          setRatingsCache((prevCache) => ({
            ...prevCache,
            [instructorName]: {
              avgRating: -1,
              avgDifficulty: -1,
              wouldTakeAgainPercent: -1,
              numRatings: 0,
              formattedName: 'TBA',
              department: '',
              link: '',
            },
          }));
        }
      });

      const fetchPromises = Array.from(instructorNames)
        .filter((instructorName) => !ratingsCache[instructorName])
        .map(async (instructorName) => {
          try {
            const response = await fetch(`/api/ratings/${encodeURIComponent(instructorName)}`);
            if (response.ok) {
              const data: IProfessorRating = await response.json();
              setRatingsCache((prevCache) => ({
                ...prevCache,
                [instructorName]: data,
              }));
            } else {
              console.error(`Failed to fetch rating for ${instructorName}: ${response.statusText}`);
              // Optionally store a default value
              setRatingsCache((prevCache) => ({
                ...prevCache,
                [instructorName]: {
                  avgRating: -1,
                  avgDifficulty: -1,
                  wouldTakeAgainPercent: -1,
                  numRatings: 0,
                  formattedName: instructorName,
                  department: '',
                  link: '',
                },
              }));
            }
          } catch (error) {
            console.error(`Error fetching rating for ${instructorName}:`, error);
            // Optionally store a default value
            setRatingsCache((prevCache) => ({
              ...prevCache,
              [instructorName]: {
                avgRating: -1,
                avgDifficulty: -1,
                wouldTakeAgainPercent: -1,
                numRatings: 0,
                formattedName: instructorName,
                department: '',
                link: '',
              },
            }));
          }
        });

      await Promise.all(fetchPromises);
    };

    fetchRatingsForSelectedCourse();
  }, [selectedCourse]);

  // Function to fetch seat capacity for a given term and CRN
  const fetchSeatCapacity = async (term: number, crn: number) => {
    try {
      const response = await fetch(`/api/seat-capacity?term=${term}&crn=${crn}`);
      if (response.ok) {
        const data = await response.json();
        setSeatCapacities((prev) => ({ ...prev, [crn]: data.data }));
      } else {
        console.error(`Failed to fetch seat capacity for CRN ${crn}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error fetching seat capacity for CRN ${crn}:`, error);
    }
  };

  // Fetch seat capacity data when selectedCourse changes
  useEffect(() => {
    if (selectedCourse) {
      selectedCourse.sections.forEach((section) => {
        fetchSeatCapacity(section.term, section.crn);
      });
    }
  }, [selectedCourse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-100 text-black dark:bg-surface-800 dark:text-white">
        <div className="w-2/3">
          <p className="mb-2 text-center text-xl">Loading courses...</p>
          <Progress value={progressValue} className="w-full bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-100 text-black dark:bg-surface-800 dark:text-white">
      <TopBar
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTopBarVisible={isTopBarVisible}
      />
      <div className="border-b border-surface-300 dark:border-surface-600 mt-16"></div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-surface-300 dark:border-surface-600 flex flex-col">
          <div className="p-4 border-b border-surface-300 dark:border-surface-600">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search courses or subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-surface-200 dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-black dark:text-white"
              />
            </div>
            <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
              <SelectTrigger className="w-full bg-surface-300 dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-black dark:text-white">
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent className="bg-surface-300 dark:bg-surface-700">
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
                  <AccordionTrigger className="px-4 text-black dark:text-white">
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
                          className="w-full justify-start px-4 py-2 text-sm text-black dark:text-white"
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
                {courseDetails ? (
<div className="mb-4">
                {courseDetails.description && (
                  <p className="mb-2">
                    <strong>Description:</strong> {courseDetails.description}
                  </p>
                )}
                {courseDetails.prerequisites && (
                  <p className="mb-2">
                    <strong>Prerequisites:</strong> {courseDetails.prerequisites}
                  </p>
                )}
                {courseDetails.recommendations && (
                  <p className="mb-2">
                    <strong>Recommendations:</strong> {courseDetails.recommendations}
                  </p>
                )}
                {courseDetails.notes && (
                  <p>
                    <strong>Notes:</strong> {courseDetails.notes}
                  </p>
                )}
                  </div>
                ) : (
                  <p>No additional details available.</p>
                )}
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
                          <motion.div
                          key={index}
                          className="mb-4 rounded-lg"
                          initial={{ borderWidth: 0, borderColor: 'transparent', boxShadow: 'none' }}
                          whileHover={{
                            scale: 1.02,
                            borderWidth: 2,
                            borderColor: 'var(--card-hover)',
                            boxShadow: '0 0 10px var(--card-hover)',
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          style={{ borderStyle: 'solid', borderRadius: '0.5rem' }}
                        >
                          <Card
                            key={index}
                            className="bg-surface-200 dark:bg-surface-700 text-black dark:text-white rounded-lg"
                          >
                            <CardHeader className="flex items-center">
                              <div className="flex flex-col">
                                <p className="text-lg font-semibold">
                                  Section: {section.section}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  CRN: {section.crn} | Units: {section.units}
                                </p>
                                {seatCapacities[section.crn] && (
                                  <p className="text-sm text-muted-foreground">
                                    Seats: {seatCapacities[section.crn].Seats.Actual} / {seatCapacities[section.crn].Seats.Capacity} ({seatCapacities[section.crn].Seats.Remaining} remaining)
                                  </p>
                                )}
                              </div>
                            </CardHeader>
                            <Divider />
                            <CardBody className="flex flex-wrap">
                              <div className="w-full md:w-1/8">
                                <p>
                                  <strong>Instructor:</strong> {section.instructor}
                                </p>
                                {section.instructor && section.instructor.trim() !== '' && section.instructor !== 'TBA' && (
                                  <>
                                    <p>
                                      <strong>Rate My Prof Rating:</strong>{' '}
                                      {ratingsCache[section.instructor] ? (
                                        ratingsCache[section.instructor].avgRating !== -1 ? (
                                          <>
                                            {ratingsCache[section.instructor].avgRating} / 5.0
                                            {' ('}
                                            {ratingsCache[section.instructor].numRatings} ratings{') '}
                                            <a
                                              href={ratingsCache[section.instructor].link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 underline"
                                            >
                                              View Profile
                                            </a>
                                          </>
                                        ) : (
                                          'N/A'
                                        )
                                      ) : (
                                        'Loading...'
                                      )}
                                    </p>
                                    <p>
                                      <strong>Level of Difficulty:</strong>{' '}
                                      {ratingsCache[section.instructor] ? (
                                        ratingsCache[section.instructor].avgDifficulty !== -1 ? (
                                          `${ratingsCache[section.instructor].avgDifficulty} / 5.0`
                                        ) : (
                                          'N/A'
                                        )
                                      ) : (
                                        'Loading...'
                                      )}
                                    </p>
                                    <p>
                                      <strong>Would Take Again:</strong>{' '}
                                      {ratingsCache[section.instructor] ? (
                                        ratingsCache[section.instructor].wouldTakeAgainPercent !== -1 ? (
                                          `${ratingsCache[section.instructor].wouldTakeAgainPercent.toFixed(2)}%`
                                        ) : (
                                          'N/A'
                                        )
                                      ) : (
                                        'Loading...'
                                      )}
                                    </p>
                                  </>
                                )}
                                <p>
                                  <strong>Method:</strong> {section.instructional_method}
                                </p>
                                <p>
                                  <strong>Time:</strong> {section.time}
                                </p>
                              </div>
                              <div className="w-full md:w-1/10">
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
                              <p className="text-sm text-muted-foreground">
                                Term: {convertTermToString(section.term)}
                              </p>
                            </CardFooter>
                          </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400 text-xl">Select a course to view details</p>
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

