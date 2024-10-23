// page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TopBar from '@/components/TopBar';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';

import { Toaster, toast } from 'sonner';

import CalendarComponent, { CalendarEvent } from '@/components/CalendarComponent';

import { useCourses } from '@/hooks/useCourses';
import { useTimetable } from '@/hooks/useTimetable';
import { useTopBarVisibility } from '@/hooks/useTopBarVisibility';

import { generateICS } from '@/utils/icsUtils';
import { generateCalendarEvents } from '../../utils/calendarUtils';
import { convertTermToString } from '@/utils/termUtils';
import { hasTimeConflict, hasInternalConflict } from '@/utils/sectionUtils';

import { Course, Section } from '@/utils/interfaces';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Calendar.css';
import 'react-resizable/css/styles.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { HexColorPicker } from 'react-colorful';

// Define interfaces
interface EventInteractionArgs {
  event: CalendarEvent;
  start: Date;
  end: Date;
  allDay?: boolean;
  isAllDay?: boolean;
  resourceId?: any;
}

interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
  resourceId?: any;
}

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
    timetables,
    currentTimetableName,
    setCurrentTimetableName,
    saveTimetable,
    loadTimetable,
    createNewTimetable,
    deleteTimetable,
    eventColors,
    assignColorToSection,
    releaseColorOfSection,
  } = useTimetable(groupedCourses);

  const isTopBarVisible = useTopBarVisibility();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  // State variables for resizable sidebars
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(256); // Default width is 256px (16rem)
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(256);
  const [seatData, setSeatData] = useState<any>(null); // Add state for seat data
  const [isFetchingSeatData, setIsFetchingSeatData] = useState<boolean>(false); // Add state for fetching status
  const [seatDataError, setSeatDataError] = useState<string | null>(null); // Add state for error handling
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]); // New state for custom events
  const [isCustomEventDialogOpen, setIsCustomEventDialogOpen] = useState<boolean>(false);
  const [customEventTitle, setCustomEventTitle] = useState<string>('');
  const [customEventDurationOption, setCustomEventDurationOption] = useState<string>('15 minutes');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customDurationHours, setCustomDurationHours] = useState<number>(0);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(0);
  const [slotInfoForCustomEvent, setSlotInfoForCustomEvent] = useState<SlotInfo | null>(null);
  const [customEventColor, setCustomEventColor] = useState<string>('#9e9e9e'); // Default color

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = 'Stop Slacking!';
        setIsTabActive(false);
      } else {
        document.title = 'Timetable';
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    } else {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
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

  // Function to check internal conflicts among new sections
  const hasInternalConflict = (sections: Section[]): boolean => {
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        if (hasTimeConflict(sections[i], [sections[j]])) {
          return true;
        }
      }
    }
    return false;
  };

  const eventStyleGetter = (event: any, start: any, end: any, isSelected: boolean) => {
    const backgroundColor = event.color || '#3c4043';
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 1,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return {
      style,
    };
  };

  const handleCourseClick = async (course: Course) => {
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

    const hasConflictWithExisting = newSelectedSections.some((newSection) =>
      hasTimeConflict(newSection, filteredPrev)
    );

    const hasConflictInternally = hasInternalConflict(newSelectedSections);

    if (hasConflictWithExisting || hasConflictInternally) {
      toast.error('Time conflict detected with existing courses or within selected sections');
      return;
    }

    setSelectedSections([...filteredPrev, ...newSelectedSections]);

    setSelectedSectionsByType((prev) => ({
      ...prev,
      ...initialSelections,
    }));

    // Assign colors to each new section
    newSelectedSections.forEach((section) => {
      assignColorToSection(section);
    });

    setSelectedCourse(course);

    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }

    // Fetch seat data
    if (newSelectedSections.length > 0) {
      const firstSection = newSelectedSections[0];
      await fetchSeatData(firstSection.term.toString(), firstSection.crn.toString()); // Fetch seat data
    }
  };

  const handleSectionSelection = async (type: string, crnValue: string) => {
    const crn = parseInt(crnValue);
    const selectedSection = selectedCourse?.sections.find((section) => section.crn === crn);

    if (selectedSection) {
      // Remove existing sections of the same type, subject, and course_number
      setSelectedSections((prev) => {
        const filteredSections = prev.filter(
          (s) =>
            !(
              s.schedule_type === type &&
              s.subject === selectedSection.subject &&
              s.course_number === selectedSection.course_number
            )
        );

        // Add the new section
        const newSections = [...filteredSections, selectedSection];

        return newSections;
      });

      // Update selectedSectionsByType
      setSelectedSectionsByType((prev) => ({
        ...prev,
        [type]: selectedSection,
      }));

      // Assign a color to the event
      assignColorToSection(selectedSection);

      // Provide a toast notification with an undo option
      toast.success(
        `${selectedSection.subject} ${selectedSection.course_number} - Section ${selectedSection.section} added`,
        {
          action: {
            label: 'Undo',
            onClick: () => {
              // Remove the section
              setSelectedSectionsByType((prev) => ({
                ...prev,
                [type]: null,
              }));
              setSelectedSections((prev) => prev.filter((s) => s.crn !== crn));
              // Release the color
              releaseColorOfSection(crn);
            },
          },
        }
      );

      // Fetch seat data for the selected section
      await fetchSeatData(selectedSection.term.toString(), selectedSection.crn.toString());
    }
  };

  useEffect(() => {
    const courseEvents = generateCalendarEvents(selectedSections, eventColors);
    setCalendarEvents([...courseEvents, ...customEvents]);
  }, [selectedSections, eventColors, customEvents]);

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

  const handleEventDoubleClick = (
    event: CalendarEvent,
    e: React.SyntheticEvent<HTMLElement>
  ) => {
    if (event.crn) {
      // Existing code for removing course events
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
      // Release the color
      releaseColorOfSection(crn);

      toast.success('Course section removed from timetable.');
    } else {
      // Custom event; remove it
      setCustomEvents((prevEvents) => prevEvents.filter((evt) => evt.id !== event.id));
      toast.success('Custom event removed.');
    }
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
    const courseString = `${course.subject || ''} ${course.course_number || ''} ${
      course.course_name || ''
    }`.toLowerCase();
    const matchesSearch = searchWords.every((word) => courseString.includes(word));
    const matchesTerm = selectedTerm
      ? course.sections.some((section) => section.term === parseInt(selectedTerm))
      : true;
    return matchesSearch && matchesTerm;
  });

  const subjectIdsWithMatchingCourses = new Set(
    filteredCourses.map((course) => course.subject)
  );

  const filteredSubjects = subjects.filter(
    (subject) =>
      (subject.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      subjectIdsWithMatchingCourses.has(subject.id)
  );

  const handleDeleteCourse = (courseToDelete: Course) => {
    // Release colors associated with the course's sections
    selectedSections.forEach((section) => {
      if (
        section.subject === courseToDelete.subject &&
        section.course_number === courseToDelete.course_number
      ) {
        releaseColorOfSection(section.crn);
      }
    });

    // Filter out sections related to the course
    const updatedSections = selectedSections.filter(
      (section) =>
        section.subject !== courseToDelete.subject ||
        section.course_number !== courseToDelete.course_number
    );
    setSelectedSections(updatedSections);

    // Remove course-related entries from selectedSectionsByType
    const updatedSectionsByType = { ...selectedSectionsByType };
    Object.keys(updatedSectionsByType).forEach((type) => {
      const section = updatedSectionsByType[type];
      if (
        section?.subject === courseToDelete.subject &&
        section?.course_number === courseToDelete.course_number
      ) {
        updatedSectionsByType[type] = null;
      }
    });
    setSelectedSectionsByType(updatedSectionsByType);

    // Optionally, update selectedCourse if the deleted course was the selected one
    if (
      selectedCourse?.subject === courseToDelete.subject &&
      selectedCourse?.course_number === courseToDelete.course_number
    ) {
      setSelectedCourse(null);
    }

    toast.success(
      `${courseToDelete.subject} ${courseToDelete.course_number} has been removed from your timetable`
    );
  };

  // Handlers for resizing sidebars
  const handleLeftResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent text selection
    const startX = e.clientX;
    const startWidth = leftSidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;
      // Set boundaries
      if (newWidth < 100) newWidth = 100; // Minimum width of 100px
      if (newWidth > 400) newWidth = 400; // Maximum width of 400px
      setLeftSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRightResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent text selection
    const startX = e.clientX;
    const startWidth = rightSidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      let newWidth = startWidth + deltaX;
      // Set boundaries
      if (newWidth < 100) newWidth = 100; // Minimum width of 100px
      if (newWidth > 400) newWidth = 400; // Maximum width of 400px
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Add fetchSeatData function
  const fetchSeatData = async (term: string, crn: string) => {
    setIsFetchingSeatData(true);
    setSeatData(null);
    setSeatDataError(null);

    try {
      const response = await fetch(`/api/seat-capacity?term=${term}&crn=${crn}`);
      if (!response.ok) {
        throw new Error('Failed to fetch seat data');
      }
      const data = await response.json();
      setSeatData(data);
    } catch (error: any) {
      console.error('Error fetching seat data:', error);
      setSeatDataError(error.message);
    } finally {
      setIsFetchingSeatData(false);
    }
  };

  // Handle event drag and drop
  const handleEventDrop = (args: EventInteractionArgs) => {
    const { event, start, end } = args;
    if (event.crn) {
      // It's a course event; prevent moving
      toast.error('Cannot move course events.');
    } else {
      // Update custom event time
      setCustomEvents((prevEvents) =>
        prevEvents.map((evt) => (evt.id === event.id ? { ...evt, start, end } : evt))
      );
      toast.success('Custom event moved.');
    }
  };

  // Handle event resizing
  const handleEventResize = (args: EventInteractionArgs) => {
    const { event, start, end } = args;
    if (event.crn) {
      toast.error('Cannot resize course events.');
    } else {
      setCustomEvents((prevEvents) =>
        prevEvents.map((evt) => (evt.id === event.id ? { ...evt, start, end } : evt))
      );
      toast.success('Custom event resized.');
    }
  };

  // Handle slot selection to add a new custom event
  const handleSlotSelect = (slotInfo: SlotInfo) => {
    // Store slotInfo in state
    setSlotInfoForCustomEvent(slotInfo);
    // Open the dialog
    setIsCustomEventDialogOpen(true);
    // Reset form inputs
    setCustomEventTitle('');
    setCustomEventDurationOption('15 minutes');
    setIsCustomDuration(false);
    setCustomDurationHours(0);
    setCustomDurationMinutes(0);
  };

  // Add the handleAddCustomEvent function
  const handleAddCustomEvent = () => {
    if (!customEventTitle.trim()) {
      toast.error('Please enter an event title.');
      return;
    }
    if (!slotInfoForCustomEvent) {
      toast.error('Invalid slot selected.');
      return;
    }

    const start = slotInfoForCustomEvent.start;
    let end: Date;

    if (isCustomDuration) {
      const totalMinutes = customDurationHours * 60 + customDurationMinutes;
      if (totalMinutes <= 0) {
        toast.error('Please enter a valid duration.');
        return;
      }
      end = new Date(start.getTime() + totalMinutes * 60000);
    } else {
      // Parse selected duration
      let durationMinutes = 0;
      switch (customEventDurationOption) {
        case '15 minutes':
          durationMinutes = 15;
          break;
        case '30 minutes':
          durationMinutes = 30;
          break;
        case '45 minutes':
          durationMinutes = 45;
          break;
        case '1 hour':
          durationMinutes = 60;
          break;
        default:
          durationMinutes = 15; // default to 15 minutes
      }
      end = new Date(start.getTime() + durationMinutes * 60000);
    }

    const newEvent: CalendarEvent = {
      id: new Date().getTime(),
      title: customEventTitle,
      start,
      end,
      color: customEventColor, // Use the selected color
    };
    setCustomEvents((prevEvents) => [...prevEvents, newEvent]);
    toast.success('Custom event added.');

    // Close the dialog
    setIsCustomEventDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-100 text-black dark:bg-surface-800 dark:text-white">
        <div className="w-2/3">
          <p className="mb-4 text-center text-xl">Loading courses...</p>
          <Progress value={progressValue} className="w-full bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div
        className="flex flex-col h-screen overflow-hidden bg-surface-100 text-black dark:bg-surface-800 dark:text-white"
        style={{ overflowX: 'hidden' }}
      >
        <TopBar
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isTopBarVisible={isTopBarVisible}
        />
        <div
          className="flex flex-1 h-full overflow-hidden relative"
          style={{
            paddingTop: isTopBarVisible ? '64px' : '0px',
            transition: 'padding-top 0.3s ease-in-out',
          }}
        >
          {/* Left Sidebar */}
          <div
            className={`flex-shrink-0 bg-surface-200 dark:bg-surface-700 text-black dark:text-white ${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  } absolute z-20 ${
                    isTopBarVisible ? 'top-16' : 'top-0'
                  } bottom-0 left-0 w-64 overflow-y-auto`
                : 'overflow-y-auto'
            }`}
            style={!isMobile ? { width: leftSidebarWidth } : undefined}
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

          {/* Left Resize Handle */}
          {!isMobile && (
            <div
              className="resize-handle-left"
              onMouseDown={handleLeftResizeMouseDown}
              style={{
                width: '5px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
              }}
            />
          )}

          {/* Center - Calendar */}
          <div className="flex-grow overflow-hidden" id="calendar-container">
            <CalendarComponent
              calendarEvents={calendarEvents}
              eventStyleGetter={eventStyleGetter}
              isMobile={isMobile}
              onEventDoubleClick={handleEventDoubleClick}
              onSelectEvent={handleEventSelect}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onSlotSelect={handleSlotSelect}
            />
          </div>

          {/* Right Resize Handle */}
          {!isMobile && (
            <div
              className="resize-handle-right"
              onMouseDown={handleRightResizeMouseDown}
              style={{
                width: '5px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
              }}
            />
          )}

          {/* Right Sidebar */}
          <div
            className={`flex-shrink-0 bg-surface-200 dark:bg-surface-700 text-black dark:text-white ${
              isMobile
                ? `transform transition-transform duration-300 ease-in-out ${
                    rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                  } absolute z-20 ${
                    isTopBarVisible ? 'top-16' : 'top-0'
                  } bottom-0 right-0 w-64 overflow-y-auto`
                : 'overflow-y-auto'
            }`}
            style={!isMobile ? { width: rightSidebarWidth } : undefined}
          >
            <RightSidebar
              selectedCourse={selectedCourse}
              selectedTerm={selectedTerm}
              selectedSectionsByType={selectedSectionsByType}
              handleSectionSelection={handleSectionSelection}
              handleExportICS={handleExportICS}
              handleSaveTimetable={saveTimetable}
              handleDeleteTimetable={deleteTimetable}
              timetables={timetables}
              currentTimetableName={currentTimetableName}
              setCurrentTimetableName={setCurrentTimetableName}
              loadTimetable={loadTimetable}
              createNewTimetable={createNewTimetable}
              handleDeleteCourse={handleDeleteCourse}
              seatData={seatData}
              isFetchingSeatData={isFetchingSeatData}
              seatDataError={seatDataError}
            />
          </div>

          {/* Mobile Swipe Arrows */}
          {isMobile && (
            <>
              {/* Left Swipe Arrow */}
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
                  <ChevronLeft className="text-black dark:text-white" />
                ) : (
                  <ChevronRight className="text-black dark:text-white" />
                )}
              </div>

              {/* Right Swipe Arrow */}
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
                  <ChevronRight className="text-black dark:text-white" />
                ) : (
                  <ChevronLeft className="text-black dark:text-white" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Custom Event Dialog */}
      <Dialog open={isCustomEventDialogOpen} onOpenChange={setIsCustomEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                placeholder="Enter event title"
                value={customEventTitle}
                onChange={(e) => setCustomEventTitle(e.target.value)}
              />
            </div>
            {/* Duration Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="event-duration">Duration</Label>
              <Select
                value={customEventDurationOption}
                onValueChange={(value) => {
                  setCustomEventDurationOption(value);
                  setIsCustomDuration(value === 'Custom');
                }}
              >
                <SelectTrigger id="event-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-surface-800">
                  <SelectItem value="15 minutes">15 minutes</SelectItem>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* If Custom is selected, show time input */}
            {isCustomDuration && (
              <div className="space-y-2">
                <Label>Custom Duration</Label>
                <div className="flex space-x-2 items-center">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={customDurationHours}
                      onChange={(e) => setCustomDurationHours(Number(e.target.value))}
                      className="w-20"
                    />
                    <span>Hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={0}
                      max={55}
                      step={5}
                      value={customDurationMinutes}
                      onChange={(e) => setCustomDurationMinutes(Number(e.target.value))}
                      className="w-20"
                    />
                    <span>Minutes</span>
                  </div>
                </div>
              </div>
            )}
            {/* Color Picker */}
            <div className="space-y-2">
              <Label htmlFor="event-color">Event Color</Label>
              <div className="flex items-center space-x-4">
                <HexColorPicker color={customEventColor} onChange={setCustomEventColor} />
                <Input
                  id="event-color"
                  value={customEventColor}
                  onChange={(e) => setCustomEventColor(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCustomEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
