// utils/calendarUtils.ts

import { parse, addMinutes, isValid } from 'date-fns';
import { Section } from '@/utils/interfaces';
import { CalendarEvent } from '@/components/CalendarComponent';

// Function to parse the 'days' string into an array of day numbers
export const parseDays = (daysString: string): number[] => {
  const daysMap: { [key: string]: number } = {
    'U': 0, // Sunday
    'M': 1, // Monday
    'T': 2, // Tuesday
    'W': 3, // Wednesday
    'R': 4, // Thursday
    'F': 5, // Friday
    'S': 6, // Saturday
  };

  // Remove any whitespace and split into individual characters
  const days = daysString.replace(/\s+/g, '').split('');
  
  // Map day initials to day numbers
  return days
    .map((day) => daysMap[day.toUpperCase()])
    .filter((day) => day !== undefined);
};

export const generateCalendarEvents = (
  sections: Section[],
  eventColors: { [crn: number]: string }
): CalendarEvent[] => {
  console.log('Generating events for sections:', sections);
  
  const events = sections.flatMap((section) => {
    console.log(`Processing section CRN ${section.crn}:`);
    console.log(`Days: ${section.days}`);
    const daysOfWeek = parseDays(section.days);
    console.log(`Parsed Days:`, daysOfWeek);

    // Ensure that various separators are handled
    const timeSeparators = [' - ', '-', '–', '—'];
    let startTimeString = '';
    let endTimeString = '';
    for (const sep of timeSeparators) {
      if (section.time.includes(sep)) {
        [startTimeString, endTimeString] = section.time.split(sep).map((s) => s.trim());
        break;
      }
    }
    // If no separator found, log an error and skip this section
    if (!startTimeString || !endTimeString) {
      console.error(`Invalid time format in section CRN ${section.crn}: ${section.time}`);
      return []; // Skip this section
    }

    console.log(`Time: ${section.time}`);
    console.log(`Start Time String: ${startTimeString}`);
    console.log(`End Time String: ${endTimeString}`);

    // Adjust the format string to match your actual time format
    // Corrected the format string to 'h:mm a'
    const timeFormat = 'h:mm a';

    // Since your time strings already have a space before 'am'/'pm', no need to adjust
    // Remove or comment out the following lines if they exist:
    // startTimeString = startTimeString.replace(/(AM|PM|am|pm)$/, ' $1');
    // endTimeString = endTimeString.replace(/(AM|PM|am|pm)$/, ' $1');
    
    const startTime = parse(startTimeString, timeFormat, new Date());
    const endTime = parse(endTimeString, timeFormat, new Date());

    console.log(`Parsed Start Time:`, startTime);
    console.log(`Parsed End Time:`, endTime);

    // Check if parsing was successful
    if (!isValid(startTime) || !isValid(endTime)) {
      console.error(`Invalid time format in section CRN ${section.crn}: ${section.time}`);
      return []; // Skip this section
    }

    // Calculate duration in minutes
    const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Handle cases where end time is before start time (e.g., time spans over midnight)
    if (durationInMinutes <= 0) {
      console.error(`Invalid time range in section CRN ${section.crn}: ${section.time}`);
      return []; // Skip this section
    }

    // Create events for each day
    return daysOfWeek.map((day: number) => {
      // Create start and end Date objects for the event
      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() + day,
        startTime.getHours(),
        startTime.getMinutes()
      );
      const endDate = addMinutes(startDate, durationInMinutes);

      return {
        id: section.crn,
        title: `${section.subject} ${section.course_number} - ${section.schedule_type}`,
        start: startDate,
        end: endDate,
        color: eventColors[section.crn] || '#3c4043', // Default color if not set
        crn: section.crn,
      } as CalendarEvent;
    });
  });

  console.log('Generated events:', events);

  return events;
};