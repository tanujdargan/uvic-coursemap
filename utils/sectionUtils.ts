// utils/sectionUtils.ts

import { Section, Course } from './interfaces'; // Adjust the import path based on your project structure
import { parseTime, dayInitialsToNumbers } from './dateUtils';

export function groupSectionsIntoCourses(sections: Section[]): Course[] {
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
