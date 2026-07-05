import { Section, Course } from './interfaces'; // Adjust the import path based on your project structure
import { parseTime, dayInitialsToNumbers } from './dateUtils';

export function groupSectionsIntoCourses(sections: Section[]): Course[] {
  const coursesMap: { [key: string]: Course } = {};
  sections.forEach((section) => {
    // Prefer the alphanumeric course_code so "370A" and "370G" stay distinct;
    // fall back to the numeric course_number for older data lacking course_code.
    const courseCode = section.course_code || String(section.course_number);
    const key = `${section.subject}-${courseCode}`;
    if (!coursesMap[key]) {
      coursesMap[key] = {
        subject: section.subject,
        course_number: section.course_number,
        course_code: courseCode,
        course_name: section.course_name,
        sections: [section],
      };
    } else {
      coursesMap[key].sections.push(section);
    }
  });

  return Object.values(coursesMap);
}

export function hasTimeConflict(newSection: Section, selectedSections: Section[]): boolean {
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
          newTime.start < time.end &&
          newTime.end > time.start
      )
    );
  });
}

export function getSectionTimes(section: Section) {
  if (!section.days || !section.time) {
    return [];
  }

  const daysArray = section.days.split('');
  // Normalize all dash variants (hyphen, en dash, em dash) and surrounding
  // whitespace so both freshly-fetched and older saved data parse cleanly.
  const timeRange = section.time
    .split(/\s*[-–—]\s*/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (timeRange.length !== 2) {
    return [];
  }

  let startTime;
  let endTime;
  try {
    startTime = parseTime(timeRange[0]);
    endTime = parseTime(timeRange[1]);
  } catch {
    return [];
  }

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

export function hasInternalConflict(sections: Section[]): boolean {
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (hasTimeConflict(sections[i], [sections[j]])) {
        return true;
      }
    }
  }
  return false;
}