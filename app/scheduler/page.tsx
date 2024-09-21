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

import { Toaster, toast } from 'sonner';

import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import CalendarComponent from '@/components/CalendarComponent';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Calendar.css';

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

  const [savedCourseColors, setSavedCourseColors] = useState<{ [key: string]: string }>({});

  const [courseColors, setCourseColors] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    fetchCourses();
    handleResize(); // Check initial screen size
    window.addEventListener('resize', handleResize);
    if (isMobile) {
      initializeSwipe();
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResize = () => {
    const isMobileView = window.innerWidth <= 768;
    setIsMobile(isMobileView);
    if (!isMobileView) {
      setLeftSidebarOpen(true);
      setRightSidebarOpen(true);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data: Section[] = await response.json();

      const grouped = groupSectionsIntoCourses(data);
      setGroupedCourses(grouped);

      const uniqueSubjects = Array.from(new Set(grouped.map((course) => course.subject)));
      uniqueSubjects.sort();

      setSubjects(
        uniqueSubjects.map((subject) => ({
          id: subject,
          name: subject,
        }))
      );

      const uniqueTerms = Array.from(new Set(data.map((section) => section.term)));
      uniqueTerms.sort((a, b) => a - b);

      setTerms(uniqueTerms);

      const currentTermCode = getCurrentTermCode();
      const currentTermIndex = uniqueTerms.findIndex((term) => term >= currentTermCode);
      const defaultTermIndex = currentTermIndex !== -1 ? currentTermIndex : 0;
      setSelectedTerm(uniqueTerms[defaultTermIndex]?.toString() || '');

      if (typeof window !== 'undefined') {
        const storedTimetable = localStorage.getItem('savedTimetable');
        if (storedTimetable) {
          const timetableData = JSON.parse(storedTimetable);
          const crns = timetableData.crns;
          const savedColors = timetableData.colors;

          const sections: Section[] = [];

          for (const crn of crns) {
            const section = findSectionByCrn(crn, grouped);
            if (section) {
              sections.push(section);
            }
          }

          setSelectedSections(sections);

          const sectionsByType: { [type: string]: Section } = {};
          sections.forEach((section) => {
            const key = section.schedule_type;
            sectionsByType[key] = section;
          });
          setSelectedSectionsByType(sectionsByType);

          setSavedCourseColors(savedColors);

          toast.success('Loaded saved timetable');
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const findSectionByCrn = (crn: number, groupedCourses: Course[]) => {
    for (const course of groupedCourses) {
      const section = course.sections.find((sec) => sec.crn === crn);
      if (section) {
        return section;
      }
    }
    return null;
  };

  useEffect(() => {
    const colorsMap: { [key: string]: string } = {};
    groupedCourses.forEach((course) => {
      const key = `${course.subject}-${course.course_number}`;
      const savedColor = savedCourseColors[key];
      if (savedColor) {
        colorsMap[key] = savedColor;
      } else {
        colorsMap[key] = eventColors[Math.floor(Math.random() * eventColors.length)];
      }
    });
    setCourseColors(colorsMap);
  }, [groupedCourses, savedCourseColors]);

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

  useEffect(() => {
    if (isMobile) {
      initializeSwipe();
    }
  }, [isMobile]);

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

  const handleCourseClick = (course: Course) => {
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

    const filteredPrev = selectedSections.filter(
      (s) => s.subject !== course.subject || s.course_number !== course.course_number
    );

    const hasConflict = newSelectedSections.some((newSection) =>
      hasTimeConflict(newSection, filteredPrev)
    );

    if (hasConflict) {
      toast.error('Time conflict detected with existing selections');
      return;
    }

    setSelectedSections([...filteredPrev, ...newSelectedSections]);

    setSelectedSectionsByType((prev) => ({
      ...prev,
      ...initialSelections,
    }));

    setSelectedCourse(course);

    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  };

  const handleSectionSelection = (type: string, crnValue: string) => {
    const crn = parseInt(crnValue);
    const selectedSection = selectedCourse?.sections.find((section) => section.crn === crn);

    if (selectedSection) {
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
        const filteredSections = prev.filter(
          (s) =>
            !(
              s.schedule_type === type &&
              s.subject === selectedSection.subject &&
              s.course_number === selectedSection.course_number
            )
        );

        const newSections = [...filteredSections, selectedSection];

        return newSections;
      });

      toast.success(
        `${selectedSection.subject} ${selectedSection.course_number} - Section ${selectedSection.section} added`,
        {
          action: {
            label: 'Undo',
            onClick: () => {
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 100 ? 0 : prev + 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

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

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    const events = selectedSections
      .flatMap((section) => {
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

        const courseKey = `${section.subject}-${section.course_number}`;
        const eventColor = courseColors[courseKey] || '#3c4043';

        return daysArray
          .map((dayInitial) => {
            const dayNumber = dayInitialsToNumbers[dayInitial];

            if (dayNumber === undefined) {
              return null;
            }

            const eventDate = getDateOfWeekday(dayNumber);

            const startDateTime = new Date(eventDate);
            startDateTime.setHours(startTime.hours, startTime.minutes);

            const endDateTime = new Date(eventDate);
            endDateTime.setHours(endTime.hours, endTime.minutes);

            return {
              title: `${section.subject} ${section.course_number} - ${section.schedule_type} ${section.section}`,
              start: startDateTime,
              end: endDateTime,
              color: eventColor,
            };
          })
          .filter(Boolean);
      })
      .filter(Boolean);

    setCalendarEvents(events);
  }, [selectedSections, courseColors]);

  const handleExportICS = () => {
    if (calendarEvents.length === 0) {
      toast.error('No events to export');
      return;
    }
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

  const handleSaveTimetable = () => {
    try {
      if (typeof window !== 'undefined') {
        const crns = selectedSections.map((section) => section.crn);
        const colors = courseColors;
        const timetableData = {
          crns,
          colors,
        };
        localStorage.setItem('savedTimetable', JSON.stringify(timetableData));
        toast.success('Timetable saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save timetable:', error);
      toast.error('Failed to save timetable');
    }
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
        <div className="border-b border-surface-300 mt-16"></div> {/* Separator line */}
        <div className={`flex flex-1 h-full ${isMobile ? 'overflow-hidden' : ''}`}>
          {/* Left Sidebar */}
          <div
            className={`${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  } absolute z-20 top-0 bottom-0 left-0 w-64`
                : 'w-64'
            }`}
          >
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
          </div>
          {/* Left Swipe Arrow */}
          {isMobile && (
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 z-20 p-2 cursor-pointer transition-transform duration-300 ${
                leftSidebarOpen ? 'left-64' : 'left-0'
              }`}
              onClick={() => {
                setLeftSidebarOpen(!leftSidebarOpen);
                setRightSidebarOpen(false);
              }}
            >
              {leftSidebarOpen ? (
                <ChevronLeft className="text-white" />
              ) : (
                <ChevronRight className="text-white" />
              )}
            </div>
          )}
          {/* Center - Calendar */}
          <div className="flex-grow ">
            <CalendarComponent
              calendarEvents={calendarEvents}
              eventStyleGetter={eventStyleGetter}
              isMobile={isMobile}
            />
          </div>
          {/* Right Sidebar */}
          <div
            className={`${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                  } absolute z-20 top-0 bottom-0 right-0 w-64`
                : 'w-64'
            }`}
          >
            <RightSidebar
              selectedCourse={selectedCourse}
              selectedTerm={selectedTerm}
              selectedSectionsByType={selectedSectionsByType}
              handleSectionSelection={handleSectionSelection}
              handleExportICS={handleExportICS}
              handleSaveTimetable={handleSaveTimetable}
            />
          </div>
          {/* Right Swipe Arrow */}
          {isMobile && (
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 z-20 p-2 cursor-pointer transition-transform duration-300 ${
                rightSidebarOpen ? 'right-64' : 'right-0'
              }`}
              onClick={() => {
                setRightSidebarOpen(!rightSidebarOpen);
                setLeftSidebarOpen(false);
              }}
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