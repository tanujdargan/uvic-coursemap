// app/api/courses/route.ts
//
// GET /api/courses?term=202609 -> Section[] (flat array; grouped client-side)
//
// Primary source: MongoDB "Course-Data".sections (populated by
// scripts/sync-banner.ts). If Mongo is unreachable / MONGODB_URI is missing /
// the collection returns 0 rows for the term, fall back to a LIVE Banner
// catalog fetch (cached 1h). In fallback mode instructor is "" — acceptable.
//
// Default term (when ?term= is omitted): the latest non-"(View Only)" term.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import type { Section } from '@/utils/interfaces';
import { getTerms, fetchTermCatalog } from '@/lib/banner';
import { getCourseDataDb, SECTIONS_COLLECTION } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Row shape as stored in Mongo (subset used to build a Section). term/crn are
// stored as numbers by the sync script but tolerated as strings for safety.
interface SectionRow {
  term: string | number;
  crn: string | number;
  subject: string;
  course_name: string;
  course_number: number;
  course_code: string | null;
  section: string;
  frequency: string;
  time: string;
  days: string;
  location: string;
  date_range: string;
  schedule_type: string;
  instructor: string;
  instructional_method: string;
  units: number;
  additional_information: string | null;
}

function rowToSection(row: SectionRow): Section {
  return {
    term: typeof row.term === 'number' ? row.term : parseInt(row.term, 10),
    subject: row.subject,
    course_name: row.course_name,
    course_number: row.course_number,
    // Fall back to the numeric course_number for rows synced before course_code
    // existed, so grouping keys stay stable.
    course_code: row.course_code || String(row.course_number),
    crn: typeof row.crn === 'number' ? row.crn : parseInt(row.crn, 10),
    section: row.section,
    frequency: row.frequency,
    time: row.time,
    days: row.days,
    location: row.location,
    date_range: row.date_range,
    schedule_type: row.schedule_type,
    instructor: row.instructor,
    instructional_method: row.instructional_method,
    units: row.units,
    ...(row.additional_information
      ? { additional_information: row.additional_information }
      : {}),
  };
}

// Latest non-view-only term code, cached 1 day.
const getDefaultTerm = unstable_cache(
  async (): Promise<string | null> => {
    const terms = await getTerms();
    const live = terms.find((t) => !/\(view only\)/i.test(t.description));
    return (live ?? terms[0])?.code ?? null;
  },
  ['default-term'],
  { revalidate: 86400 }
);

// Cached live-catalog fallback (per term), 1 hour.
function liveCatalog(term: string): Promise<Section[]> {
  return unstable_cache(
    () => fetchTermCatalog(term),
    ['live-catalog', term],
    { revalidate: 3600 }
  )();
}

async function fetchFromMongo(term: string): Promise<Section[] | null> {
  try {
    const db = await getCourseDataDb();
    const termNum = parseInt(term, 10);
    const rows = (await db
      .collection<SectionRow>(SECTIONS_COLLECTION)
      .find({ term: termNum })
      .toArray()) as SectionRow[];
    if (rows.length === 0) return null;
    return rows.map(rowToSection);
  } catch (error) {
    // Missing MONGODB_URI or an unreachable cluster both land here; degrade to
    // the live Banner fallback rather than surfacing an error.
    console.error('Mongo unavailable:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let term = searchParams.get('term') ?? undefined;

  try {
    if (!term) {
      const def = await getDefaultTerm();
      if (!def) {
        return NextResponse.json(
          { error: 'No term available' },
          { status: 502 }
        );
      }
      term = def;
    }

    // Try Mongo first.
    const fromDb = await fetchFromMongo(term);
    if (fromDb && fromDb.length > 0) {
      return NextResponse.json(fromDb);
    }

    // Fall back to a live Banner fetch (cached).
    const live = await liveCatalog(term);
    return NextResponse.json(live);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    return NextResponse.json(
      { error: 'Error retrieving courses' },
      { status: 502 }
    );
  }
}
