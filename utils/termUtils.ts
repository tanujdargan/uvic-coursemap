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

  /**
   * Pick the default term from a getTerms-style list (assumed newest-first):
   * the nearest registerable (non-view-only) term at or after today's YYYYMM,
   * falling back to the newest non-view-only, then the newest overall.
   * E.g. in July 2026 with [202701, 202609, 202605] -> 202609, not 202701.
   */
  export function pickDefaultTerm<T extends { code: string; viewOnly?: boolean }>(
    terms: T[]
  ): T | undefined {
    const now = new Date();
    const nowCode = now.getFullYear() * 100 + (now.getMonth() + 1);
    const open = terms.filter((t) => !t.viewOnly);
    const upcoming = open
      .filter((t) => parseInt(t.code, 10) >= nowCode)
      .sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
    return upcoming[0] ?? open[0] ?? terms[0];
  }