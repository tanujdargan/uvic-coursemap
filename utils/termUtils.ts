// utils/termUtils.ts

export function convertTermToString(termCode: number): string {
    const termStr = termCode.toString();
    const year = termStr.substring(0, 4);
    const semesterCode = termStr.substring(4);
    let semester = '';
  
    switch (semesterCode) {
      case '01':
        semester = 'Spring';
        break;
      case '05':
        semester = 'Summer';
        break;
      case '09':
        semester = 'Fall';
        break;
      default:
        semester = 'Unknown';
    }
  
    return `${semester} ${year}`;
  }
  export function getCurrentTermCode(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
  
    let semesterCode = '09'; // Default to Fall
    if (month <= 4) {
      semesterCode = '01'; // Spring
    } else if (month <= 8) {
      semesterCode = '05'; // Summer
    }
  
    return parseInt(`${year}${semesterCode}`);
  }