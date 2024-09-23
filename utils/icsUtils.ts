// utils/icsUtils.ts
import { format } from 'date-fns';

export const generateICS = (events: any[]) => {
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
