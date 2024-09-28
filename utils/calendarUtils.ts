// utils/calendarUtils.ts
import { parseTime, dayInitialsToNumbers, getDateOfWeekday } from '@/utils/dateUtils';
import { Section } from '@/utils/interfaces';

export function generateCalendarEvents(
  selectedSections: Section[],
  courseColors: { [crn: number]: string }
) {
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

      //const courseKey = `${section.subject}-${section.course_number}`;
      const eventColor = courseColors[section.crn] || '#3c4043';

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
            crn: section.crn,
          };
        })
        .filter(Boolean);
    })
    .filter(Boolean);

  return events;
}