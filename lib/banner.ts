// lib/banner.ts
//
// Typed, server-side client for UVic's Banner 9 Self-Service (SSB) JSON API.
// Node runtime only (uses native fetch + manual cookie handling for the
// session-based catalog search). Empirically verified 2026-07-05.
//
// Base: https://banner.uvic.ca/StudentRegistrationSsb/ssb
//
// This module maps raw Banner JSON into the FROZEN legacy `Section` shape
// declared in utils/interfaces.ts. Do not change that shape here.

import type { Section } from '@/utils/interfaces';

export const BANNER_BASE =
  'https://banner.uvic.ca/StudentRegistrationSsb/ssb';

const USER_AGENT =
  'uvic-coursemap/1.0 (+https://github.com/uvic-coursemap; polite academic tool)';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BannerTerm {
  code: string;
  description: string;
}

export interface EnrollmentInfo {
  Seats: { Capacity: number; Actual: number; Remaining: number };
  Waitlist: { Capacity: number; Actual: number; Remaining: number };
}

export interface FacultyMeeting {
  displayName: string;
  emailAddress: string;
  primaryIndicator: boolean;
  buildingDescription?: string;
  room?: string;
}

// The raw Banner meeting time shape (subset we care about).
interface BannerMeetingTime {
  beginTime: string | null;
  endTime: string | null;
  building: string | null;
  buildingDescription: string | null;
  room: string | null;
  startDate: string | null;
  endDate: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  meetingTypeDescription?: string | null;
}

interface BannerMeetingsFaculty {
  meetingTime?: BannerMeetingTime;
  faculty?: Array<{
    displayName?: string;
    emailAddress?: string;
    primaryIndicator?: boolean;
  }>;
}

// The raw Banner section shape (subset we consume).
export interface BannerSection {
  term: string;
  courseReferenceNumber: string;
  subject: string;
  courseNumber: string;
  courseTitle: string;
  sequenceNumber: string;
  scheduleTypeDescription: string;
  creditHours: number | null;
  creditHourLow: number | null;
  creditHourHigh: number | null;
  maximumEnrollment: number | null;
  enrollment: number | null;
  seatsAvailable: number | null;
  waitCapacity: number | null;
  waitCount: number | null;
  waitAvailable: number | null;
  linkIdentifier: string | null;
  isSectionLinked: boolean;
  subjectCourse: string;
  instructionalMethod?: string | null;
  instructionalMethodDescription?: string | null;
  meetingsFaculty?: BannerMeetingsFaculty[];
}

// ---------------------------------------------------------------------------
// Polite concurrency helper (default limit 5)
// ---------------------------------------------------------------------------

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

// ---------------------------------------------------------------------------
// Cookie handling for the session-based catalog search
// ---------------------------------------------------------------------------

function extractSetCookies(res: Response): string[] {
  // Node >= 18.14 exposes getSetCookie(); fall back to the single header.
  const anyHeaders = res.headers as unknown as {
    getSetCookie?: () => string[];
  };
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

class CookieJar {
  private jar = new Map<string, string>();

  absorb(res: Response) {
    for (const raw of extractSetCookies(res)) {
      const pair = raw.split(';', 1)[0];
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (name) this.jar.set(name, value);
      }
    }
  }

  header(): string {
    return Array.from(this.jar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers (Banner raw -> legacy Section field formats)
// ---------------------------------------------------------------------------

const DAY_KEYS: Array<[keyof BannerMeetingTime, string]> = [
  ['monday', 'M'],
  ['tuesday', 'T'],
  ['wednesday', 'W'],
  ['thursday', 'R'],
  ['friday', 'F'],
  ['saturday', 'S'],
  ['sunday', 'U'],
];

/** Booleans -> concatenated initials "MTWRF" (order M T W R F S U). */
export function formatDays(mt: BannerMeetingTime): string {
  let out = '';
  for (const [key, initial] of DAY_KEYS) {
    if (mt[key]) out += initial;
  }
  return out;
}

/** "0830" -> "8:30 am", "1300" -> "1:00 pm", "1230" -> "12:30 pm". */
export function formatBannerTime(hhmm: string | null | undefined): string {
  if (!hhmm || !/^\d{3,4}$/.test(hhmm)) return '';
  const padded = hhmm.padStart(4, '0');
  let hours = parseInt(padded.slice(0, 2), 10);
  const minutes = padded.slice(2, 4);
  const meridiem = hours >= 12 ? 'pm' : 'am';
  let display = hours % 12;
  if (display === 0) display = 12;
  return `${display}:${minutes} ${meridiem}`;
}

/** beginTime/endTime -> "8:30 am - 9:20 am" (separator " - "). */
export function formatTimeRange(
  begin: string | null | undefined,
  end: string | null | undefined
): string {
  const b = formatBannerTime(begin);
  const e = formatBannerTime(end);
  if (!b || !e) return '';
  return `${b} - ${e}`;
}

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

/**
 * Normalize a Banner date to "MM/DD". Banner is inconsistent across endpoints:
 *  - searchResults returns "09/09/2026" (MM/DD/YYYY)
 *  - getFacultyMeetingTimes returns "Sep 09, 2026"
 * Returns "" on failure.
 */
function bannerDateToMMDD(date: string | null | undefined): string {
  if (!date) return '';
  const trimmed = date.trim();

  // MM/DD/YYYY
  const slash = /^(\d{1,2})\/(\d{1,2})\/\d{2,4}$/.exec(trimmed);
  if (slash) {
    return `${slash[1].padStart(2, '0')}/${slash[2].padStart(2, '0')}`;
  }

  // "Mon DD, YYYY"
  const named = /^([A-Za-z]{3})\s+(\d{1,2}),/.exec(trimmed);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    if (month) return `${month}/${named[2].padStart(2, '0')}`;
  }

  return '';
}

/** "Sep 09, 2026" + "Dec 06, 2026" -> "09/09-12/06". */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const s = bannerDateToMMDD(start);
  const e = bannerDateToMMDD(end);
  if (!s && !e) return '';
  return `${s}-${e}`;
}

const SCHEDULE_TYPES = ['Lecture', 'Lab', 'Tutorial', 'Seminar'] as const;

/** Normalize scheduleTypeDescription into the frozen enum. */
export function normalizeScheduleType(raw: string | null | undefined): string {
  if (!raw) return 'Other';
  const lower = raw.toLowerCase();
  if (lower.includes('lecture')) return 'Lecture';
  if (lower.includes('lab')) return 'Lab';
  if (lower.includes('tutorial')) return 'Tutorial';
  if (lower.includes('seminar')) return 'Seminar';
  // Exact match against canonical set (defensive)
  for (const t of SCHEDULE_TYPES) {
    if (lower === t.toLowerCase()) return t;
  }
  return 'Other';
}

/** buildingDescription + room -> "Elliott Building 167". */
export function formatLocation(mt: BannerMeetingTime | undefined): string {
  if (!mt) return '';
  const parts: string[] = [];
  const building = mt.buildingDescription;
  const room = mt.room;
  if (building && building !== 'None specified') parts.push(building);
  if (room && room !== 'None specified') parts.push(room);
  return parts.join(' ').trim();
}

function firstMeetingTime(
  section: BannerSection
): BannerMeetingTime | undefined {
  const mf = section.meetingsFaculty ?? [];
  for (const entry of mf) {
    if (entry.meetingTime) return entry.meetingTime;
  }
  return undefined;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Map a raw Banner search-results section into the FROZEN legacy Section shape.
 * `instructor` is left "" here — search results never carry faculty; the sync
 * script enriches it via getFacultyMeetingTimes().
 */
export function mapBannerSection(section: BannerSection): Section {
  const mt = firstMeetingTime(section);
  const units =
    section.creditHours ?? section.creditHourLow ?? section.creditHourHigh ?? 0;

  return {
    term: toNumber(section.term),
    subject: section.subject ?? '',
    course_name: section.courseTitle ?? '',
    course_number: toNumber(section.courseNumber),
    course_code: (section.courseNumber ?? String(toNumber(section.courseNumber))).trim(),
    crn: toNumber(section.courseReferenceNumber),
    section: section.sequenceNumber ?? '',
    frequency: mt?.meetingTypeDescription ?? '',
    time: mt ? formatTimeRange(mt.beginTime, mt.endTime) : '',
    days: mt ? formatDays(mt) : '',
    location: formatLocation(mt),
    date_range: mt ? formatDateRange(mt.startDate, mt.endDate) : '',
    schedule_type: normalizeScheduleType(section.scheduleTypeDescription),
    instructor: '',
    instructional_method:
      section.instructionalMethodDescription ??
      section.instructionalMethod ??
      '',
    units: typeof units === 'number' ? units : toNumber(units),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /classSearch/getTerms — no auth. */
export async function getTerms(max = 50): Promise<BannerTerm[]> {
  const url = `${BANNER_BASE}/classSearch/getTerms?searchTerm=&offset=1&max=${max}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Banner getTerms failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as BannerTerm[];
  return Array.isArray(data) ? data : [];
}

/** GET /classSearch/get_subject — no auth. */
export async function getSubjects(
  term: string,
  max = 500
): Promise<Array<{ code: string; description: string }>> {
  const url = `${BANNER_BASE}/classSearch/get_subject?searchTerm=&term=${term}&offset=1&max=${max}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Banner getSubjects failed: ${res.status} ${res.statusText}`
    );
  }
  return (await res.json()) as Array<{ code: string; description: string }>;
}

/**
 * Full term catalog. Performs the cookie-session handshake, then walks the
 * paged search results (500/page). One session == one term.
 * Returns mapped legacy Sections (instructor === "").
 */
export async function fetchTermCatalog(term: string): Promise<Section[]> {
  const jar = new CookieJar();

  // 1. Handshake — establishes JSESSIONID.
  const handshake = await fetch(
    `${BANNER_BASE}/term/termSelection?mode=search`,
    { headers: DEFAULT_HEADERS, cache: 'no-store' }
  );
  jar.absorb(handshake);
  await handshake.text().catch(() => undefined);

  // 2. Reset any stale filter state for this session.
  const reset = await fetch(`${BANNER_BASE}/classSearch/resetDataForm`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
  });
  jar.absorb(reset);
  await reset.text().catch(() => undefined);

  // 3. Select the term.
  const select = await fetch(`${BANNER_BASE}/term/search?mode=search`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `term=${encodeURIComponent(term)}`,
    cache: 'no-store',
  });
  jar.absorb(select);
  await select.text().catch(() => undefined);

  // 4. Paged walk (cap 500 per page).
  const PAGE_SIZE = 500;
  const collected: BannerSection[] = [];
  let pageOffset = 0;
  let totalCount = Infinity;

  while (collected.length < totalCount) {
    const url =
      `${BANNER_BASE}/searchResults/searchResults` +
      `?txt_term=${encodeURIComponent(term)}` +
      `&pageOffset=${pageOffset}&pageMaxSize=${PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, Cookie: jar.header() },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(
        `Banner searchResults failed: ${res.status} ${res.statusText}`
      );
    }
    const body = (await res.json()) as {
      totalCount?: number;
      data?: BannerSection[] | null;
    };
    if (typeof body.totalCount === 'number') totalCount = body.totalCount;
    const rows = body.data ?? [];
    if (rows.length === 0) break; // guard against empty pages
    collected.push(...rows);
    pageOffset += rows.length;

    // Small politeness delay between pages.
    if (collected.length < totalCount) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return collected.map(mapBannerSection);
}

/** Return the raw Banner sections (unmapped) — used by the sync script. */
export async function fetchTermCatalogRaw(
  term: string
): Promise<BannerSection[]> {
  const jar = new CookieJar();

  const handshake = await fetch(
    `${BANNER_BASE}/term/termSelection?mode=search`,
    { headers: DEFAULT_HEADERS, cache: 'no-store' }
  );
  jar.absorb(handshake);
  await handshake.text().catch(() => undefined);

  const reset = await fetch(`${BANNER_BASE}/classSearch/resetDataForm`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
  });
  jar.absorb(reset);
  await reset.text().catch(() => undefined);

  const select = await fetch(`${BANNER_BASE}/term/search?mode=search`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `term=${encodeURIComponent(term)}`,
    cache: 'no-store',
  });
  jar.absorb(select);
  await select.text().catch(() => undefined);

  const PAGE_SIZE = 500;
  const collected: BannerSection[] = [];
  let pageOffset = 0;
  let totalCount = Infinity;

  while (collected.length < totalCount) {
    const url =
      `${BANNER_BASE}/searchResults/searchResults` +
      `?txt_term=${encodeURIComponent(term)}` +
      `&pageOffset=${pageOffset}&pageMaxSize=${PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, Cookie: jar.header() },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(
        `Banner searchResults failed: ${res.status} ${res.statusText}`
      );
    }
    const body = (await res.json()) as {
      totalCount?: number;
      data?: BannerSection[] | null;
    };
    if (typeof body.totalCount === 'number') totalCount = body.totalCount;
    const rows = body.data ?? [];
    if (rows.length === 0) break;
    collected.push(...rows);
    pageOffset += rows.length;
    if (collected.length < totalCount) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return collected;
}

/**
 * Live seat/waitlist numbers for one CRN.
 * POST /searchResults/getEnrollmentInfo — no auth; returns a small HTML
 * fragment which we regex-parse into numbers.
 */
export async function getEnrollmentInfo(
  term: string | number,
  crn: string | number
): Promise<EnrollmentInfo> {
  const res = await fetch(`${BANNER_BASE}/searchResults/getEnrollmentInfo`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Accept: 'text/html, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `term=${encodeURIComponent(String(term))}&courseReferenceNumber=${encodeURIComponent(
      String(crn)
    )}`,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(
      `Banner getEnrollmentInfo failed: ${res.status} ${res.statusText}`
    );
  }
  const html = await res.text();

  // Banner localizes the enrolment labels: depending on the request's
  // Accept-Language, the server returns Canadian "Enrolment" (single L) or
  // American "Enrollment" (double L). `Enroll?ment` matches both. The label
  // argument is treated as a regex source (all our labels are literal-safe).
  const grab = (labelPattern: string): number => {
    const re = new RegExp(labelPattern + '[\\s\\S]*?(-?\\d+)');
    const m = re.exec(html);
    return m ? parseInt(m[1], 10) : 0;
  };

  const enrolActual = grab('Enroll?ment Actual:');
  const enrolMax = grab('Enroll?ment Maximum:');
  const enrolAvail = grab('Enroll?ment Seats Available:');
  const waitCap = grab('Waitlist Capacity:');
  const waitActual = grab('Waitlist Actual:');
  const waitAvail = grab('Waitlist Seats Available:');

  return {
    Seats: {
      Capacity: enrolMax,
      Actual: enrolActual,
      Remaining: enrolAvail,
    },
    Waitlist: {
      Capacity: waitCap,
      Actual: waitActual,
      Remaining: waitAvail,
    },
  };
}

/**
 * Instructors + real meeting locations for one CRN.
 * GET /searchResults/getFacultyMeetingTimes — no auth.
 */
export async function getFacultyMeetingTimes(
  term: string | number,
  crn: string | number
): Promise<FacultyMeeting[]> {
  const url =
    `${BANNER_BASE}/searchResults/getFacultyMeetingTimes` +
    `?term=${encodeURIComponent(String(term))}` +
    `&courseReferenceNumber=${encodeURIComponent(String(crn))}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Banner getFacultyMeetingTimes failed: ${res.status} ${res.statusText}`
    );
  }
  const body = (await res.json()) as {
    fmt?: Array<{
      faculty?: Array<{
        displayName?: string;
        emailAddress?: string;
        primaryIndicator?: boolean;
      }>;
      meetingTime?: {
        buildingDescription?: string;
        room?: string;
      };
    }>;
  };

  const out: FacultyMeeting[] = [];
  for (const entry of body.fmt ?? []) {
    const faculty = entry.faculty ?? [];
    for (const f of faculty) {
      out.push({
        displayName: f.displayName ?? '',
        emailAddress: f.emailAddress ?? '',
        primaryIndicator: Boolean(f.primaryIndicator),
        buildingDescription: entry.meetingTime?.buildingDescription,
        room: entry.meetingTime?.room,
      });
    }
    // Keep the meeting location even when Banner lists no instructor —
    // this endpoint has real buildings where the bulk search says "None specified".
    if (faculty.length === 0 && entry.meetingTime) {
      out.push({
        displayName: '',
        emailAddress: '',
        primaryIndicator: false,
        buildingDescription: entry.meetingTime.buildingDescription,
        room: entry.meetingTime.room,
      });
    }
  }
  return out;
}

/**
 * Best meeting location from a faculty/meeting list, formatted like the
 * legacy data: "Clearihue Building A313". Returns "" when Banner has none.
 */
export function meetingLocation(faculty: FacultyMeeting[]): string {
  const unspecified = (v?: string) => !v || v === 'None specified';
  const entry = faculty.find((f) => !unspecified(f.buildingDescription));
  if (!entry) return '';
  const room = unspecified(entry.room) ? '' : ` ${entry.room}`;
  return `${entry.buildingDescription}${room}`;
}

/** GET /searchResults/fetchLinkedSections — no auth. */
export async function fetchLinkedSections(
  term: string | number,
  crn: string | number
): Promise<unknown> {
  const url =
    `${BANNER_BASE}/searchResults/fetchLinkedSections` +
    `?term=${encodeURIComponent(String(term))}` +
    `&courseReferenceNumber=${encodeURIComponent(String(crn))}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Banner fetchLinkedSections failed: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

/**
 * Pick the primary instructor display name from a faculty list.
 * Returns "" if none (frontend renders "" as TBA).
 */
export function primaryInstructorName(faculty: FacultyMeeting[]): string {
  const primary =
    faculty.find((f) => f.primaryIndicator) ??
    faculty.find((f) => f.displayName); // skip location-only placeholder entries
  return primary?.displayName ?? '';
}

export function primaryInstructorEmail(faculty: FacultyMeeting[]): string {
  const primary =
    faculty.find((f) => f.primaryIndicator) ??
    faculty.find((f) => f.displayName);
  return primary?.emailAddress ?? '';
}
