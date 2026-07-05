// app/api/course-details/[courseId]/route.ts
//
// GET /api/course-details/CSC110
//   -> { pid, courseId, subjectCode, title, description, credits,
//        prerequisites?, recommendations?, notes? }  (200)
//   -> 404 when nothing is known (frontend degrades gracefully)
//
// Primary source: UVic's public Kuali catalog API (uvic.kuali.co, no auth).
// If Kuali can't answer, fall back to MongoDB: first the legacy
// "CourseDetails" collection (rich data the user's cluster may still hold),
// then a minimal object built from the "sections" collection
// (title/credits/subjectCode, description:""). All Mongo access degrades
// gracefully when MONGODB_URI is missing or the cluster is unreachable.
// Never 500 on the happy/degraded paths.

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import type { CourseDetails } from '@/utils/interfaces';
import { getCourseDataDb, SECTIONS_COLLECTION } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const revalidate = 86400; // 1 day

const KUALI_BASE = 'https://uvic.kuali.co/api/v1/catalog';
const KUALI_HEADERS = {
  'User-Agent': 'uvic-coursemap/1.0 (polite academic tool)',
  Accept: 'application/json',
};

// ---------------------------------------------------------------------------
// HTML / value helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(p|div|li|ul|ol|br|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function parseCredits(credits: unknown): number {
  if (typeof credits === 'number') return credits;
  if (credits && typeof credits === 'object') {
    const c = credits as {
      value?: string | number;
      credits?: { max?: string | number; min?: string | number };
    };
    const raw =
      c.value ?? c.credits?.max ?? c.credits?.min ?? undefined;
    if (raw !== undefined) {
      const n = typeof raw === 'number' ? raw : parseFloat(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function splitCourseId(courseId: string): { subject: string; number: string } {
  const m = /^([A-Za-z]+)\s*(\w.*)$/.exec(courseId.trim());
  if (!m) return { subject: courseId.toUpperCase(), number: '' };
  return { subject: m[1].toUpperCase(), number: m[2] };
}

// ---------------------------------------------------------------------------
// Kuali catalog discovery (latest undergrad + graduate catalog ids)
// ---------------------------------------------------------------------------

interface KualiCatalog {
  _id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

const getCatalogIds = unstable_cache(
  async (): Promise<string[]> => {
    const res = await fetch(`${KUALI_BASE}/public/catalogs/`, {
      headers: KUALI_HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Kuali catalogs ${res.status}`);
    const catalogs = (await res.json()) as KualiCatalog[];

    const pickLatest = (kind: 'undergrad' | 'grad'): string | null => {
      const match = catalogs
        .filter((c) => {
          const t = (c.title ?? '').toLowerCase();
          return kind === 'undergrad'
            ? t.includes('undergraduate')
            : t.includes('graduate') && !t.includes('undergraduate');
        })
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
      return match[0]?._id ?? null;
    };

    const ids = [pickLatest('undergrad'), pickLatest('grad')].filter(
      (x): x is string => Boolean(x)
    );
    // Fallback: if titles didn't match, use the two most recent overall.
    if (ids.length === 0) {
      return catalogs
        .slice()
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
        .slice(0, 2)
        .map((c) => c._id);
    }
    return ids;
  },
  ['kuali-catalog-ids'],
  { revalidate: 86400 }
);

// ---------------------------------------------------------------------------
// Kuali lookup
// ---------------------------------------------------------------------------

interface KualiSearchHit {
  pid: string;
  code: string;
  title: string;
  description?: string;
  subjectCode?: { name?: string };
}

interface KualiCourse {
  pid: string;
  __catalogCourseId?: string;
  title?: string;
  description?: string;
  credits?: unknown;
  subjectCode?: { name?: string };
  preAndCorequisites?: string;
  preOrCorequisites?: string;
  supplementalNotes?: string;
}

async function kualiLookup(courseId: string): Promise<CourseDetails | null> {
  const { subject, number } = splitCourseId(courseId);
  const query = number ? `${subject} ${number}` : subject;
  const normalizedId = courseId.replace(/\s+/g, '').toUpperCase();

  let catalogIds: string[];
  try {
    catalogIds = await getCatalogIds();
  } catch (e) {
    console.error('Kuali catalog discovery failed:', e);
    return null;
  }

  for (const catalogId of catalogIds) {
    let hits: KualiSearchHit[];
    try {
      const res = await fetch(
        `${KUALI_BASE}/search/${catalogId}?q=${encodeURIComponent(query)}`,
        { headers: KUALI_HEADERS, cache: 'no-store' }
      );
      if (!res.ok) continue;
      hits = (await res.json()) as KualiSearchHit[];
    } catch {
      continue;
    }
    if (!Array.isArray(hits)) continue;

    const hit = hits.find(
      (h) => (h.code ?? '').replace(/\s+/g, '').toUpperCase() === normalizedId
    );
    if (!hit) continue;

    // Fetch full course record for credits / prerequisites / notes.
    let course: KualiCourse | null = null;
    try {
      const res = await fetch(
        `${KUALI_BASE}/course/${catalogId}/${hit.pid}`,
        { headers: KUALI_HEADERS, cache: 'no-store' }
      );
      if (res.ok) course = (await res.json()) as KualiCourse;
    } catch {
      /* fall back to search hit below */
    }

    const src = course ?? {};
    const prereqHtml =
      (src as KualiCourse).preAndCorequisites ??
      (src as KualiCourse).preOrCorequisites;
    const prerequisites = stripHtml(prereqHtml);
    const notes = stripHtml((src as KualiCourse).supplementalNotes);

    const details: CourseDetails = {
      pid: hit.pid,
      courseId:
        (src as KualiCourse).__catalogCourseId ?? normalizedId,
      subjectCode:
        (src as KualiCourse).subjectCode?.name ??
        hit.subjectCode?.name ??
        subject,
      title: (src as KualiCourse).title ?? hit.title ?? '',
      description: stripHtml(
        (src as KualiCourse).description ?? hit.description
      ),
      credits: parseCredits((src as KualiCourse).credits),
      ...(prerequisites ? { prerequisites } : {}),
      ...(notes ? { notes } : {}),
    };
    return details;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mongo fallbacks
// ---------------------------------------------------------------------------

// Legacy "CourseDetails" collection shape (capitalized field names). The user's
// cluster may still carry this rich data from before the Kuali migration.
interface LegacyCourseDetailsDoc {
  PID?: string;
  'Course ID'?: string;
  'Subject Code'?: string;
  Title?: string;
  Description?: string;
  Credits?: number | string;
  Prerequisites?: string;
  Recommendations?: string;
  Notes?: string;
}

// 1. Legacy CourseDetails collection (rich data, remapped field names).
async function legacyMongoDetails(
  courseId: string
): Promise<CourseDetails | null> {
  const normalizedId = courseId.replace(/\s+/g, '').toUpperCase();
  try {
    const db = await getCourseDataDb();
    const doc = (await db
      .collection<LegacyCourseDetailsDoc>('CourseDetails')
      .findOne({ 'Course ID': courseId })) as LegacyCourseDetailsDoc | null;
    if (!doc) return null;
    const creditsRaw = doc.Credits;
    const credits =
      typeof creditsRaw === 'number'
        ? creditsRaw
        : creditsRaw
          ? parseFloat(creditsRaw) || 0
          : 0;
    return {
      pid: doc.PID ?? '',
      courseId: doc['Course ID'] ?? normalizedId,
      subjectCode: doc['Subject Code'] ?? '',
      title: doc.Title ?? '',
      description: doc.Description ?? '',
      credits,
      ...(doc.Prerequisites ? { prerequisites: doc.Prerequisites } : {}),
      ...(doc.Recommendations ? { recommendations: doc.Recommendations } : {}),
      ...(doc.Notes ? { notes: doc.Notes } : {}),
    };
  } catch (e) {
    console.error('Legacy CourseDetails lookup failed:', e);
    return null;
  }
}

// 2. Minimal fallback from the "sections" collection (description:"").
async function sectionsMongoDetails(
  courseId: string
): Promise<CourseDetails | null> {
  const { subject, number } = splitCourseId(courseId);
  try {
    const db = await getCourseDataDb();
    // Match on the raw course_code (e.g. "370A") so alphanumeric courses
    // resolve; falls through to subject-only when no number was supplied.
    const filter: Record<string, unknown> = { subject };
    if (number) filter.course_code = number;
    const row = (await db
      .collection(SECTIONS_COLLECTION)
      .findOne(filter)) as {
      subject: string;
      course_name: string;
      units: number;
    } | null;
    if (!row) return null;
    return {
      pid: '',
      courseId: courseId.replace(/\s+/g, '').toUpperCase(),
      subjectCode: row.subject,
      title: row.course_name ?? '',
      description: '',
      credits: row.units ?? 0,
    };
  } catch (e) {
    console.error('Mongo sections course-details fallback failed:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;
  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }

  const decoded = decodeURIComponent(courseId);

  // 1. Kuali (rich data).
  const fromKuali = await kualiLookup(decoded);
  if (fromKuali) return NextResponse.json(fromKuali);

  // 2. Legacy Mongo CourseDetails (rich data, if the cluster still has it).
  const fromLegacy = await legacyMongoDetails(decoded);
  if (fromLegacy) return NextResponse.json(fromLegacy);

  // 3. Minimal Mongo sections fallback.
  const fromDb = await sectionsMongoDetails(decoded);
  if (fromDb) return NextResponse.json(fromDb);

  // 4. Nothing known — 404 (frontend hides the description panel).
  return NextResponse.json(
    { error: 'Course details not found' },
    { status: 404 }
  );
}
