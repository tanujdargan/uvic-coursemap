'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TopBar from '@/components/TopBar';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import {
  isSameDay,
  parseTime,
  dayInitialsToNumbers,
  getDateOfWeekday,
} from '@/utils/dateUtils';
import { convertTermToString, getCurrentTermCode } from '@/utils/termUtils';
import {
  groupSectionsIntoCourses,
  hasTimeConflict,
  getSectionTimes,
} from '@/utils/sectionUtils';

// Import Sonner for toast notifications
import { Toaster, toast } from 'sonner';

// ** Import React Big Calendar and necessary dependencies **
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import CalendarComponent from '@/components/CalendarComponent';

// Import CSS for React Big Calendar and custom styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Calendar.css';

// Removed direct import of HammerJS
// import Hammer from 'hammerjs';

// Import interfaces
import { Course, Section, Subject } from '../../utils/interfaces';

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

  // ** Additional state for mounting check **
  const [isMounted, setIsMounted] = useState<boolean>(false);

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
    setIsMounted(true);
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isMounted) {
      handleResize(); // Check initial screen size
      window.addEventListener('resize', handleResize);
      // Initialize swipe gestures
      initializeSwipe();
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isMounted]);

  const handleResize = () => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
      } else {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    }
  };

  const initializeSwipe = () => {
    if (typeof window !== 'undefined') {
      import('hammerjs').then((module) => {
        const Hammer = module.default;
        const calendarElement = document.getElementById('calendar-container');
        if (calendarElement && Hammer) {
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
      });
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

  // Load selectedSections from localStorage when groupedCourses are loaded
  useEffect(() => {
    if (isMounted && groupedCourses.length > 0 && typeof window !== 'undefined') {
      const storedCrns = localStorage.getItem('selectedCrns');
      if (storedCrns) {
        const crns = JSON.parse(storedCrns); // an array of crns
        const sections: Section[] = [];

        for (const crn of crns) {
          const section = findSectionByCrn(crn, groupedCourses);
          if (section) {
            sections.push(section);
          }
        }

        setSelectedSections(sections);

        // Also set selectedSectionsByType
        const sectionsByType: { [type: string]: Section } = {};
        sections.forEach((section) => {
          const key = section.schedule_type;
          sectionsByType[key] = section;
        });
        setSelectedSectionsByType(sectionsByType);
      }
    }
  }, [isMounted, groupedCourses]);

  const findSectionByCrn = (crn: number, groupedCourses: Course[]) => {
    for (const course of groupedCourses) {
      const section = course.sections.find((sec) => sec.crn === crn);
      if (section) {
        return section;
      }
    }
    return null;
  };

  // Save selectedSections to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const crns = selectedSections.map((section) => section.crn);
      localStorage.setItem('selectedCrns', JSON.stringify(crns));
    }
  }, [selectedSections]);

  // Handle course click
  const handleCourseClick = (course: Course) => {
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

    const newSelectedSections = Object.values(initialSelections);

    // Remove previous selections of this course
    const filteredPrev = selectedSections.filter(
      (s) => s.subject !== course.subject || s.course_number !== course.course_number
    );

    // Check for time conflicts between newSelectedSections and filteredPrev
    const hasConflict = newSelectedSections.some((newSection) =>
      hasTimeConflict(newSection, filteredPrev)
    );

    if (hasConflict) {
      toast.error('Time conflict detected with existing selections');
      return;
    }

    // No conflict, proceed to update state
    setSelectedSections([...filteredPrev, ...newSelectedSections]);

    setSelectedSectionsByType((prev) => ({
      ...prev,
      ...initialSelections,
    }));

    setSelectedCourse(course);

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

  // Function to generate ICS file content
  const handleExportICS = () => {
    const ICSContent = generateICS(calendarEvents);
    const blob = new Blob([ICSContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateICS = (events: any[]) => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourAppName//EN',
    ];

    events.forEach((event, index) => {
      const uid = `event-${index}@yourapp.com`;
      const dtstamp = formatDate(event.start);
      const dtstart = formatDate(event.start);
      const dtend = formatDate(event.end);
      const summary = event.title;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
      lines.push(`SUMMARY:${escapeICS(summary)}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };

  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeICS = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

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
        {/* Export to ICS Button */}
        <div className="fixed bottom-4 right-4 z-20">
          <button
            className="bg-primary text-white px-4 py-2 rounded"
            onClick={handleExportICS}
          >
            Export to .ics
          </button>
        </div>
        <div className="border-b border-surface-300 mt-16"></div> {/* Separator line */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <div
            className={`transition-transform duration-300 ${
              leftSidebarOpen ? 'transform translate-x-0' : 'transform -translate-x-full'
            } ${isMobile ? 'absolute z-10 top-0 bottom-0 left-0 w-64' : ''}`}
          >
            {leftSidebarOpen && (
              <LeftSidebar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedTerm={selectedTerm}
                setSelectedTerm={setSelectedTerm}
                terms={terms}
                filteredSubjects={filteredSubjects}
                filteredCourses={filteredCourses}
                handleCourseClick={handleCourseClick}
                convertTermToString={convertTermToString}
              />
            )}
          </div>
          {/* Left Swipe Arrow */}
          {isMobile && (
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 p-2 cursor-pointer"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            >
              {leftSidebarOpen ? (
                <ChevronLeft className="text-white" />
              ) : (
                <ChevronRight className="text-white" />
              )}
            </div>
          )}
          {/* Center - Calendar */}
          <CalendarComponent
            calendarEvents={calendarEvents}
            eventStyleGetter={eventStyleGetter} // If you have a custom style getter
            isMobile={isMobile}
          />

          {/* Right Sidebar */}
          <div
            className={`transition-transform duration-300 ${
              rightSidebarOpen ? 'transform translate-x-0' : 'transform translate-x-full'
            } ${isMobile ? 'absolute z-10 top-0 bottom-0 right-0 w-64' : ''}`}
          >
            {rightSidebarOpen && (
              <RightSidebar
                selectedCourse={selectedCourse}
                selectedTerm={selectedTerm}
                selectedSectionsByType={selectedSectionsByType}
                handleSectionSelection={handleSectionSelection}
              />
            )}
          </div>

          {/* Right Swipe Arrow */}
          {isMobile && (
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-2 cursor-pointer"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              {rightSidebarOpen ? (
                <ChevronRight className="text-white" />
              ) : (
                <ChevronLeft className="text-white" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}