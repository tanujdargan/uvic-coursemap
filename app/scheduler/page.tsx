// page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TopBar from '@/components/TopBar';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';

import { Toaster, toast } from 'sonner';

import CalendarComponent from '@/components/CalendarComponent';

import { useCourses } from '@/hooks/useCourses';
import { useTimetable } from '@/hooks/useTimetable';
import { useTopBarVisibility } from '@/hooks/useTopBarVisibility';

import { generateICS } from '@/utils/icsUtils';
import { generateCalendarEvents } from '@/utils/CalendarUtils'; // Corrected casing
import { convertTermToString } from '@/utils/termUtils';
import { hasTimeConflict } from '@/utils/sectionUtils';

import { Course, Section } from '@/utils/interfaces';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Calendar.css';

export default function ScheduleBuilderPage() {
  const {
    groupedCourses,
    subjects,
    terms,
    selectedTerm,
    setSelectedTerm,
    loading,
    progressValue,
  } = useCourses();

  const {
    selectedSections,
    setSelectedSections,
    selectedSectionsByType,
    setSelectedSectionsByType,
    courseColors,
    setCourseColors,
    savedCourseColors,
    setSavedCourseColors,
    timetables,
    currentTimetableName,
    setCurrentTimetableName,
    saveTimetable,
    loadTimetable,
    createNewTimetable,
    deleteTimetable,
  } = useTimetable(groupedCourses);

  const isTopBarVisible = useTopBarVisibility();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    handleResize();
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

  const findSectionByCrn = (crn: number) => {
    for (const course of groupedCourses) {
      const section = course.sections.find((sec) => sec.crn === crn);
      if (section) {
        return section;
      }
    }
    return null;
  };

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
    const colorsMap: { [key: string]: string } = { ...courseColors };

    groupedCourses.forEach((course) => {
      const key = `${course.subject}-${course.course_number}`;
      if (!colorsMap[key]) {
        const savedColor = savedCourseColors[key];
        if (savedColor) {
          colorsMap[key] = savedColor;
        } else {
          colorsMap[key] = eventColors[Math.floor(Math.random() * eventColors.length)];
        }
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
      toast.error('Time conflict detected with existing courses');
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
    const events = generateCalendarEvents(selectedSections, courseColors);
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

  const handleEventDoubleClick = (event: any) => {
    const crn = event.crn;
    setSelectedSections((prevSections) =>
      prevSections.filter((section) => section.crn !== crn)
    );
    setSelectedSectionsByType((prev) => {
      const newSelectedSectionsByType = { ...prev };
      for (let type in newSelectedSectionsByType) {
        if (newSelectedSectionsByType[type]?.crn === crn) {
          newSelectedSectionsByType[type] = null;
        }
      }
      return newSelectedSectionsByType;
    });
    toast.success('Event removed from timetable');
  };

  const handleEventSelect = (event: any) => {
    const crn = event.crn;
    const section = selectedSections.find((s) => s.crn === crn);

    if (section) {
      const courseKey = `${section.subject}-${section.course_number}`;
      const course = groupedCourses.find(
        (c) => `${c.subject}-${c.course_number}` === courseKey
      );

      if (course) {
        setSelectedCourse(course);

        setSelectedSectionsByType((prev) => {
          const updated = { ...prev };
          updated[section.schedule_type] = section;
          return updated;
        });

        if (isMobile) {
          setRightSidebarOpen(true);
        }
      }
    }
  };

  const searchWords = (searchTerm || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

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
      <div className="flex flex-col h-screen overflow-hidden bg-surface-100 text-white">
        <TopBar
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isTopBarVisible={isTopBarVisible}
        />
        <div
          className="flex flex-1 h-full overflow-hidden"
          style={{
            paddingTop: isTopBarVisible ? '64px' : '0px',
            transition: 'padding-top 0.3s ease-in-out',
          }}
        >
          {/* Left Sidebar */}
          <div
            className={`${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  } absolute z-20 top-16 bottom-0 left-0 w-64 overflow-y-auto`
                : 'w-64 overflow-y-auto'
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
          <div className="flex-grow overflow-hidden" id="calendar-container">
            <CalendarComponent
              calendarEvents={calendarEvents}
              eventStyleGetter={eventStyleGetter}
              isMobile={isMobile}
              onEventDoubleClick={handleEventDoubleClick}
              onSelectEvent={handleEventSelect}
            />
          </div>
          {/* Right Sidebar */}
          <div
            className={`${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                  } absolute z-20 top-16 bottom-0 right-0 w-64 overflow-y-auto`
                : 'w-64 overflow-y-auto'
            }`}
            style={{ display: isMobile && !rightSidebarOpen ? 'none' : 'block' }}
          >
            <RightSidebar
              selectedCourse={selectedCourse}
              selectedTerm={selectedTerm}
              selectedSectionsByType={selectedSectionsByType}
              handleSectionSelection={handleSectionSelection}
              handleExportICS={handleExportICS}
              handleSaveTimetable={() => saveTimetable(currentTimetableName)}
              handleDeleteTimetable={() => deleteTimetable(currentTimetableName)}
              timetables={timetables}
              currentTimetableName={currentTimetableName}
              setCurrentTimetableName={setCurrentTimetableName}
              loadTimetable={loadTimetable}
              createNewTimetable={createNewTimetable}
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
