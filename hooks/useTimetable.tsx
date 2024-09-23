// hooks/useTimetable.tsx
import { useState, useEffect } from 'react';
import { Course, Section } from '@/utils/interfaces';
import { toast } from 'sonner';

export function useTimetable(groupedCourses: Course[]) {
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [selectedSectionsByType, setSelectedSectionsByType] = useState<{ [type: string]: Section | null }>({});
  const [courseColors, setCourseColors] = useState<{ [key: string]: string }>({});
  const [savedCourseColors, setSavedCourseColors] = useState<{ [key: string]: string }>({});
  const [timetables, setTimetables] = useState<any[]>([]);
  const [currentTimetableName, setCurrentTimetableName] = useState<string>('My Timetable');
  const [isTimetableLoaded, setIsTimetableLoaded] = useState<boolean>(false);

  useEffect(() => {
    fetchTimetables();
  }, [groupedCourses]); // Add groupedCourses as a dependency

  // Define findSectionByCrn inside the hook
  const findSectionByCrn = (crn: number) => {
    for (const course of groupedCourses) {
      const section = course.sections.find((sec) => sec.crn === crn);
      if (section) {
        return section;
      }
    }
    return null;
  };

  const fetchTimetables = () => {
    if (typeof window !== 'undefined') {
      const storedTimetables = localStorage.getItem('timetables');
      if (storedTimetables) {
        const parsedTimetables = JSON.parse(storedTimetables);
        setTimetables(parsedTimetables);
        // Load the most recent timetable by default
        const latestTimetable = parsedTimetables[parsedTimetables.length - 1];
        if (latestTimetable) {
          loadTimetable(latestTimetable.name);
        }
      }
    }
  };


  const saveTimetable = (name: string) => {
    try {
      if (!name.trim()) {
        toast.error('Please enter a valid timetable name');
        return;
      }
      const existingTimetable = timetables.find((tt) => tt.name === name);
      if (existingTimetable && name !== currentTimetableName) {
        toast.error('A timetable with this name already exists');
        return;
      }
      if (typeof window !== 'undefined') {
        const crns = selectedSections.map((section) => section.crn);
        const colors = courseColors;
        const timetableData = {
          name,
          crns,
          colors,
          timestamp: new Date().toISOString(),
        };

        const updatedTimetables = [...timetables.filter((tt) => tt.name !== name), timetableData];
        setTimetables(updatedTimetables);
        localStorage.setItem('timetables', JSON.stringify(updatedTimetables));
        setCurrentTimetableName(name);
        toast.success(`Timetable "${name}" saved successfully!`);
      }
    } catch (error) {
      console.error('Failed to save timetable:', error);
      toast.error('Failed to save timetable');
    }
  };

const loadTimetable = (name: string) => {
    const timetable = timetables.find((tt) => tt.name === name);
    if (timetable) {
      setCurrentTimetableName(name);
      const { crns, colors } = timetable;

      // Use findSectionByCrn with groupedCourses
      const sections: Section[] = [];

      for (const crn of crns) {
        const section = findSectionByCrn(crn);
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

      setSavedCourseColors(colors);
      setCourseColors(colors);

      toast.success(`Loaded timetable "${name}"`);
    }
  };


  const createNewTimetable = () => {
    setSelectedSections([]);
    setSelectedSectionsByType({});
    setSavedCourseColors({});
    setCourseColors({});
    setCurrentTimetableName(`Timetable ${timetables.length + 1}`);
    toast.success('Created new timetable');
  };

  const deleteTimetable = (name: string) => {
    const updatedTimetables = timetables.filter((tt) => tt.name !== name);
    setTimetables(updatedTimetables);
    localStorage.setItem('timetables', JSON.stringify(updatedTimetables));

    if (name === currentTimetableName) {
      // If the current timetable is deleted, load the default or create a new one
      if (updatedTimetables.length > 0) {
        loadTimetable(updatedTimetables[0].name);
      } else {
        createNewTimetable();
      }
    }
    toast.success(`Deleted timetable "${name}"`);
  };

  return {
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
    isTimetableLoaded,
    setIsTimetableLoaded,
  };
}
