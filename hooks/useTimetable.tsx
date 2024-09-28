// useTimetable.tsx
import { useState, useEffect } from 'react';
import { Course, Section } from '@/utils/interfaces';
import { toast } from 'sonner';

export function useTimetable(groupedCourses: Course[]) {
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [selectedSectionsByType, setSelectedSectionsByType] = useState<{
    [type: string]: Section | null;
  }>({});
  const [eventColors, setEventColors] = useState<{ [crn: number]: string }>({});
  const [assignedColors, setAssignedColors] = useState<{ [color: string]: string }>({});
  const [timetables, setTimetables] = useState<any[]>([]);
  const [currentTimetableName, setCurrentTimetableName] = useState<string>('My Timetable');
  const [isTimetableLoaded, setIsTimetableLoaded] = useState<boolean>(false);

  const eventColorPalette = [
    '#59a8d0', // Blue
    '#e951bd', // Pink
    '#5ccf77', // Green
    '#ec6716', // Orange
    '#da88e5', // Purple
    '#e67c73', // Terracotta
    '#cf875c', // Brown
    '#ffd366', // Yellow
  ];

  useEffect(() => {
    fetchTimetables();
  }, [groupedCourses]);

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
        const colors = eventColors;
        const assigned = assignedColors;
        const timetableData = {
          name,
          crns,
          colors,
          assignedColors: assigned,
          timestamp: new Date().toISOString(),
        };

        const updatedTimetables = [
          ...timetables.filter((tt) => tt.name !== name),
          timetableData,
        ];
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
      const { crns, colors, assignedColors: savedAssignedColors } = timetable;

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

      setEventColors(colors);

      // Restore assignedColors
      setAssignedColors(savedAssignedColors || {});

      toast.success(`Loaded timetable "${name}"`);
    }
  };

  const createNewTimetable = () => {
    setSelectedSections([]);
    setSelectedSectionsByType({});
    setEventColors({});
    setAssignedColors({});
    setCurrentTimetableName(`Timetable ${timetables.length + 1}`);
    toast.success('Created new timetable');
  };

  const deleteTimetable = (name: string) => {
    const updatedTimetables = timetables.filter((tt) => tt.name !== name);
    setTimetables(updatedTimetables);
    localStorage.setItem('timetables', JSON.stringify(updatedTimetables));

    if (name === currentTimetableName) {
      if (updatedTimetables.length > 0) {
        loadTimetable(updatedTimetables[0].name);
      } else {
        createNewTimetable();
      }
    }
    toast.success(`Deleted timetable "${name}"`);
  };

  // Assign a unique color to a course's sections
  const assignColorToSection = (section: Section) => {
    const courseKey = `${section.subject}-${section.course_number}`;
    // Check if any section of this course already has a color
    let existingColor = null;
    for (const color in assignedColors) {
      if (assignedColors[color] === courseKey) {
        existingColor = color;
        break;
      }
    }
    if (existingColor) {
      setEventColors((prevColors) => ({
        ...prevColors,
        [section.crn]: existingColor,
      }));
      return;
    }

    // Assign new color
    const availableColor = eventColorPalette.find(
      (color) => !(color in assignedColors)
    );
    if (!availableColor) {
      toast.error('All colors are currently in use. Unable to assign a new color.');
      return;
    }
    setEventColors((prevColors) => ({
      ...prevColors,
      [section.crn]: availableColor,
    }));
    setAssignedColors((prevAssigned) => ({
      ...prevAssigned,
      [availableColor]: courseKey,
    }));
  };

  // Release the color assigned to a course if no sections are left
  const releaseColorOfSection = (crn: number) => {
    const color = eventColors[crn];
    if (color) {
      setEventColors((prevColors) => {
        const newColors = { ...prevColors };
        delete newColors[crn];
        return newColors;
      });
      const section = selectedSections.find((s) => s.crn === crn);
      if (section) {
        const courseKey = `${section.subject}-${section.course_number}`;
        const otherSectionsOfCourse = selectedSections.filter(
          (s) =>
            s.crn !== crn &&
            s.subject === section.subject &&
            s.course_number === section.course_number &&
            eventColors[s.crn] === color
        );
        if (otherSectionsOfCourse.length === 0) {
          setAssignedColors((prevAssigned) => {
            const newAssigned = { ...prevAssigned };
            delete newAssigned[color];
            return newAssigned;
          });
        }
      }
    }
  };

  return {
    selectedSections,
    setSelectedSections,
    selectedSectionsByType,
    setSelectedSectionsByType,
    eventColors,
    assignColorToSection,
    releaseColorOfSection,
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