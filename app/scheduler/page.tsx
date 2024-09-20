// app/schedule-builder/page.tsx

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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import TopBar from '../../components/TopBar';

// Import NextUI RadioGroup components
import { RadioGroup, Radio } from '@nextui-org/react';

// Import Sonner for toast notifications
import { Toaster, toast } from 'sonner';

// ** Import React Big Calendar and necessary dependencies **
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

// Import CSS for React Big Calendar and custom styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Calendar.css'; // Make sure to create this CSS file with custom styles

// Import HammerJS for swipe gestures
import Hammer from 'hammerjs';

// Interfaces
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
  const [selectedSectionsByType, setSelectedSectionsByType] = useState<{
    [type: string]: Section | null;
  }>({});

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // ** Define locales and localizer for react-big-calendar **
  const locales = {
    'en-US': enUS,
  };

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  // ** Define a list of 8 colors **
  const eventColors = [
    '#039BE5', // Blue
    '#D81B60', // Pink
    '#43A047', // Green
    '#FB8C00', // Orange
    '#8E24AA', // Purple
    '#FDD835', // Yellow
    '#6D4C41', // Brown
    '#1E88E5', // Light Blue
  ];

  // ** Assign a random color to each course and store in a map **
  const [courseColors, setCourseColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const colorsMap: { [key: string]: string } = {};
    groupedCourses.forEach((course) => {
      const key = `${course.subject}-${course.course_number}`;
      // Assign a random color from the list
      colorsMap[key] = eventColors[Math.floor(Math.random() * eventColors.length)];
    });
    setCourseColors(colorsMap);
  }, [groupedCourses]);

  // ** Define event style getter for custom event styling **
  const eventStyleGetter = (event: any, start: any, end: any, isSelected: boolean) => {
    const backgroundColor = event.color || '#3c4043';
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return {
      style,
    };
  };

  // ** Define custom date cell wrapper for time slot styling **
  const ColoredDateCellWrapper = ({ children }: any) =>
    React.cloneElement(React.Children.only(children), {
      style: {
        backgroundColor: '#202124',
      },
    });

  useEffect(() => {
    fetchCourses();
    handleResize(); // Check initial screen size
    window.addEventListener('resize', handleResize);
    // Initialize swipe gestures
    initializeSwipe();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
    if (window.innerWidth > 768) {
      setLeftSidebarOpen(true);
      setRightSidebarOpen(true);
    } else {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  };

  const initializeSwipe = () => {
    if (typeof window !== 'undefined') {
      const calendarElement = document.getElementById('calendar-container');
      if (calendarElement) {
        const hammer = new Hammer(calendarElement);

        hammer.on('swipeleft', () => {
          setRightSidebarOpen(true);
          setLeftSidebarOpen(false);
        });

        hammer.on('swiperight', () => {
          setLeftSidebarOpen(true);
          setRightSidebarOpen(false);
        });
      }
    }
  };

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
      uniqueTerms.sort((a, b) => a - b); // Sort in ascending order

      setTerms(uniqueTerms);

      // Select the closest upcoming term
      const currentTermCode = getCurrentTermCode();
      const currentTermIndex = uniqueTerms.findIndex((term) => term >= currentTermCode);
      const defaultTermIndex = currentTermIndex !== -1 ? currentTermIndex : 0;
      setSelectedTerm(uniqueTerms[defaultTermIndex]?.toString() || '');
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle course click
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);

    // Automatically select the first section of each type
    const initialSelections: { [type: string]: Section } = {};

    ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'].forEach((type) => {
      const sectionsOfType = course.sections
        .filter((section) => section.schedule_type === type)
        .sort((a, b) => a.section.localeCompare(b.section));

      if (sectionsOfType.length > 0) {
        initialSelections[type] = sectionsOfType[0];
      }
    });

    setSelectedSectionsByType((prev) => ({
      ...prev,
      ...initialSelections,
    }));

    const newSelectedSections = Object.values(initialSelections);

    setSelectedSections((prev) => {
      // Remove previous selections of this course
      const filteredPrev = prev.filter(
        (s) => s.subject !== course.subject || s.course_number !== course.course_number
      );

      return [...filteredPrev, ...newSelectedSections];
    });

    // If on mobile, close left sidebar
    if (isMobile) {
      setLeftSidebarOpen(false);
    }
  };

  // Handle section selection
  const handleSectionSelection = (type: string, crnValue: string) => {
    const crn = parseInt(crnValue);
    const selectedSection = selectedCourse?.sections.find((section) => section.crn === crn);

    if (selectedSection) {
      // Check for time conflict
      const hasConflict = hasTimeConflict(selectedSection, selectedSections);

      if (hasConflict) {
        toast.error(`Time conflict detected for section ${selectedSection.section}`);
        return;
      }

      setSelectedSectionsByType((prev) => ({
        ...prev,
        [type]: selectedSection,
      }));

      setSelectedSections((prev) => {
        // Remove any previous selection of this type for this course
        const filteredSections = prev.filter(
          (s) =>
            !(
              s.schedule_type === type &&
              s.subject === selectedSection.subject &&
              s.course_number === selectedSection.course_number
            )
        );

        // Add the new selection
        const newSections = [...filteredSections, selectedSection];

        return newSections;
      });

      // Show toast notification with undo option
      toast.success(
        `${selectedSection.subject} ${selectedSection.course_number} - Section ${selectedSection.section} added`,
        {
          action: {
            label: 'Undo',
            onClick: () => {
              // Undo the selection
              setSelectedSectionsByType((prev) => ({
                ...prev,
                [type]: null,
              }));

              setSelectedSections((prev) => prev.filter((s) => s.crn !== crn));
            },
          },
        }
      );
    }
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
  const searchWords = (searchTerm || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  const filteredCourses = groupedCourses.filter((course) => {
    const courseString = `${course.subject || ''} ${course.course_number || ''} ${
      course.course_name || ''
    }`.toLowerCase();
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

  // Calendar events
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    // Generate calendar events based on selectedSections
    const events = selectedSections
      .flatMap((section) => {
        // Ensure 'days' and 'time' are defined
        if (!section.days || !section.time) {
          return [];
        }

        const daysArray = section.days.split('');
        const timeRange = section.time.split('-').map((t) => t.trim());

        // Check if timeRange has both start and end times
        if (timeRange.length !== 2) {
          return [];
        }

        const startTime = parseTime(timeRange[0]);
        const endTime = parseTime(timeRange[1]);

        const courseKey = `${section.subject}-${section.course_number}`;
        const eventColor = courseColors[courseKey] || '#3c4043';

        return daysArray
          .map((dayInitial) => {
            const dayNumber = dayInitialsToNumbers[dayInitial];

            if (dayNumber === undefined) {
              // Skip unknown day initial
              return null;
            }

            // Create event date by setting weekday to dayNumber in the current week
            const eventDate = getDateOfWeekday(dayNumber);

            const startDateTime = new Date(eventDate);
            startDateTime.setHours(startTime.hours, startTime.minutes);

            const endDateTime = new Date(eventDate);
            endDateTime.setHours(endTime.hours, endTime.minutes);

            return {
              title: `${section.subject} ${section.course_number} - ${section.schedule_type} ${section.section}`,
              start: startDateTime,
              end: endDateTime,
              color: eventColor, // Assign color to event
            };
          })
          .filter(Boolean); // Filter out any null values
      })
      .filter(Boolean); // Filter out any null values

    setCalendarEvents(events);
  }, [selectedSections, courseColors]);

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
    <>
      <Toaster position="top-center" richColors />
      <div className="flex flex-col h-screen bg-surface-100 text-white">
        <TopBar />
        <div className="border-b border-surface-300 mt-16"></div> {/* Separator line */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          {leftSidebarOpen && (
            <div className="w-full md:w-1/4 border-r border-surface-300 flex flex-col bg-surface-100 absolute md:relative z-10 left-0 top-0 h-full">
              <div className="p-4 border-b border-surface-300">
                <div className="relative mb-4">
                  <Search className="absolute left-2 top-2.5 h-5 w-5 text-surface-500" />
                  <Input
                    type="search"
                    placeholder="Search courses or subjects"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-surface-300 border-surface-400 text-white placeholder-surface-500 rounded-md"
                  />
                </div>
                <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
                  <SelectTrigger className="w-full bg-surface-300 border-surface-400 text-white placeholder-surface-500 rounded-md">
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
                      <AccordionTrigger className="px-4 text-surface-600 hover:text-white">
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
                              className="w-full justify-start px-4 py-2 text-sm text-surface-600 hover:text-white"
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
          )}

          {/* Left Swipe Arrow */}
          {!leftSidebarOpen && isMobile && (
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 cursor-pointer"
              onClick={() => setLeftSidebarOpen(true)}
            >
              <ChevronRight className="text-white" />
            </div>
          )}

          {/* Center - Calendar */}
          <div
            id="calendar-container"
            className={`flex flex-col overflow-hidden flex-1 ${
              isMobile ? '' : 'w-1/2'
            }`}
          >
            <div className="flex-1 overflow-y-auto p-0"> {/* Removed padding for edge-to-edge */}
              {/* React Big Calendar Component */}
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                defaultView="week"
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                components={{
                  timeSlotWrapper: ColoredDateCellWrapper,
                  header: CustomHeader,
                }}
                views={['week']}
                step={60}
                timeslots={1}
                min={new Date(0, 0, 0, 7, 0, 0)}
                max={new Date(0, 0, 0, 22, 0, 0)}
                toolbar={false} // Hide the default toolbar
              />
            </div>
          </div>

          {/* Right Sidebar */}
          {rightSidebarOpen && (
            <div className="w-full md:w-1/4 border-l border-surface-100 p-4 absolute md:relative z-10 right-0 top-0 h-full bg-surface-100">
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
                          <RadioGroup
                            orientation="vertical"
                            value={selectedSectionsByType[type]?.crn.toString() || ''}
                            onValueChange={(value) => handleSectionSelection(type, value)}
                          >
                            {sectionsOfType.map((section) => (
                              <Radio key={section.crn} value={section.crn.toString()}>
                                Section {section.section} - {section.days} {section.time}
                              </Radio>
                            ))}
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-surface-400 text-xl">Select a course to view sections</p>
                </div>
              )}
            </div>
          )}

          {/* Right Swipe Arrow */}
          {!rightSidebarOpen && isMobile && (
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 cursor-pointer"
              onClick={() => setRightSidebarOpen(true)}
            >
              <ChevronLeft className="text-white" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Custom Header component for the calendar
const CustomHeader = ({
  date,
  label,
}: {
  date: Date;
  label: string;
}) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = date.getDay();
  const dayName = daysOfWeek[dayIndex];
  const dayNumber = date.getDate();

  const isToday = isSameDay(date, new Date());

  return (
    <div
      className="rbc-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      <span style={{ fontSize: '14px', color: isToday ? '#4285F4' : '#e8eaed' }}>
        {dayName}
      </span>
      <span
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isToday ? '#4285F4' : 'transparent',
          color: 'white',
          width: '28px',
          height: '28px',
          lineHeight: '28px',
          borderRadius: '50%',
          textAlign: 'center',
          marginTop: '4px',
        }}
      >
        {dayNumber}
      </span>
    </div>
  );
};

// Helper function to check if two dates are the same day
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
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

// Helper function to get current term code
function getCurrentTermCode(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let semesterCode = '09'; // Default to Fall
  if (month <= 4) {
    semesterCode = '01'; // Spring
  } else if (month <= 8) {
    semesterCode = '05'; // Summer
  }

  return parseInt(`${year}${semesterCode}`);
}

// Helper functions for calendar event generation
const dayInitialsToNumbers: { [key: string]: number } = {
  M: 1, // Monday
  T: 2, // Tuesday
  W: 3, // Wednesday
  R: 4, // Thursday
  F: 5, // Friday
  S: 6, // Saturday
  U: 0, // Sunday
};

function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Remove whitespace at the start and end, and convert to lowercase
  timeStr = timeStr.trim().toLowerCase();

  // Regular expression to parse time in 'h:mma', 'h:mm am', or 'h:mm a' formats
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
  const match = timeRegex.exec(timeStr);

  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function getDateOfWeekday(weekday: number): Date {
  const date = new Date(); // Today's date
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = weekday - day;
  const eventDate = new Date(date);
  eventDate.setDate(date.getDate() + diff);
  eventDate.setHours(0, 0, 0, 0); // Reset time
  return eventDate;
}

// Helper function to check for time conflicts
function hasTimeConflict(newSection: Section, selectedSections: Section[]): boolean {
  const newSectionTimes = getSectionTimes(newSection);

  return selectedSections.some((section) => {
    // Skip if the section is the same as the new one
    if (section.crn === newSection.crn) {
      return false;
    }

    const sectionTimes = getSectionTimes(section);

    return newSectionTimes.some((newTime) =>
      sectionTimes.some(
        (time) =>
          time &&
          newTime &&
          time.day === newTime.day &&
          ((newTime.start < time.end && newTime.end > time.start))
      )
    );
  });
}

function getSectionTimes(section: Section) {
  if (!section.days || !section.time) {
    return [];
  }

  const daysArray = section.days.split('');
  const timeRange = section.time.split('-').map((t) => t.trim());

  if (timeRange.length !== 2) {
    return [];
  }

  const startTime = parseTime(timeRange[0]);
  const endTime = parseTime(timeRange[1]);

  return daysArray
    .map((dayInitial) => {
      const dayNumber = dayInitialsToNumbers[dayInitial];
      if (dayNumber === undefined) {
        return null;
      }
      return {
        day: dayNumber,
        start: startTime.hours * 60 + startTime.minutes,
        end: endTime.hours * 60 + endTime.minutes,
      };
    })
    .filter(Boolean) as { day: number; start: number; end: number }[];
}