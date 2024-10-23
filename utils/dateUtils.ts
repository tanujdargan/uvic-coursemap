// utils/dateUtils.ts

export function isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
  
  export const dayInitialsToNumbers: { [key: string]: number } = {
    M: 1, // Monday
    T: 2, // Tuesday
    W: 3, // Wednesday
    R: 4, // Thursday
    F: 5, // Friday
    S: 6, // Saturday
    U: 0, // Sunday
  };
  
  export function parseTime(timeStr: string): { hours: number; minutes: number } {
    // Remove whitespace at the start and end, and convert to lowercase
    timeStr = timeStr.trim().toLowerCase();
  
    // Regular expression to parse time in 'h:mma', 'h:mm am', or 'h:mm a' formats
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
    const match = timeRegex.exec(timeStr);
  
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
  
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];
  
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
  
    return { hours, minutes };
  }
  
  export function getDateOfWeekday(weekday: number): Date {
    const date = new Date(); // Today's date
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = weekday - day;
    const eventDate = new Date(date);
    eventDate.setDate(date.getDate() + diff);
    eventDate.setHours(0, 0, 0, 0); // Reset time
    return eventDate;
  }