// scripts/sync-banner.ts
//
// Sync a full Banner term catalog into MongoDB "Course-Data".sections.
//
//   npx tsx scripts/sync-banner.ts --term 202609 [--skip-instructors]
//
// Steps:
//   1. Fetch the full catalog (session handshake + paged 500 walk).
//   2. (unless --skip-instructors) enrich each CRN's instructor via
//      getFacultyMeetingTimes (concurrency 4, retry x2, progress logging).
//   3. bulkWrite upserts to Mongo in batches of 500, keyed on {term, crn}.
//
// Reads .env.local via dotenv. Fails clearly if MONGODB_URI is missing.

import { config as loadEnv } from 'dotenv';
import path from 'node:path';

// Load env before importing anything that reads process.env at module init.
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';
import {
  fetchTermCatalogRaw,
  mapBannerSection,
  getFacultyMeetingTimes,
  primaryInstructorName,
  primaryInstructorEmail,
  meetingLocation,
  mapWithConcurrency,
  type BannerSection,
} from '../lib/banner';
import { MONGO_DB_NAME, SECTIONS_COLLECTION } from '../lib/mongodb';

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  let term: string | undefined;
  let skipInstructors = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--term') {
      term = argv[++i];
    } else if (a.startsWith('--term=')) {
      term = a.slice('--term='.length);
    } else if (a === '--skip-instructors') {
      skipInstructors = true;
    }
  }
  return { term, skipInstructors };
}

// ---------------------------------------------------------------------------
// Row builder
// ---------------------------------------------------------------------------

function buildRow(
  raw: BannerSection,
  instructor: string,
  instructorEmail: string,
  location?: string
) {
  const s = mapBannerSection(raw);
  return {
    term: Number(raw.term),
    crn: Number(raw.courseReferenceNumber),
    subject: s.subject,
    course_name: s.course_name,
    course_number: s.course_number,
    course_code: s.course_code,
    section: s.section,
    frequency: s.frequency,
    time: s.time,
    days: s.days,
    // Prefer the per-CRN meeting location — bulk search says "None specified"
    location: location || s.location,
    date_range: s.date_range,
    schedule_type: s.schedule_type,
    instructor,
    instructional_method: s.instructional_method,
    units: s.units,
    additional_information: s.additional_information ?? null,
    seats_available: raw.seatsAvailable ?? null,
    max_enrollment: raw.maximumEnrollment ?? null,
    enrollment: raw.enrollment ?? null,
    wait_capacity: raw.waitCapacity ?? null,
    wait_count: raw.waitCount ?? null,
    wait_available: raw.waitAvailable ?? null,
    link_identifier: raw.linkIdentifier ?? null,
    is_section_linked: Boolean(raw.isSectionLinked),
    instructor_email: instructorEmail || null,
    synced_at: new Date().toISOString(),
  };
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  label: string
): Promise<T | null> {
  let lastErr: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
  }
  console.warn(`  ! ${label} failed after ${attempts + 1} tries:`, lastErr);
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { term, skipInstructors } = parseArgs(process.argv.slice(2));

  if (!term) {
    console.error('Usage: npx tsx scripts/sync-banner.ts --term 202609 [--skip-instructors]');
    process.exit(1);
  }

  // Fail loudly & early if the connection string is missing.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      '\nMONGODB_URI is not set. Add it to .env.local to sync the catalog ' +
        'into MongoDB (Course-Data.sections).\n'
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const collection = client
    .db(MONGO_DB_NAME)
    .collection(SECTIONS_COLLECTION);

  // Ensure indexes (createIndex is idempotent).
  await collection.createIndex({ term: 1, crn: 1 }, { unique: true });
  await collection.createIndex({ term: 1, subject: 1 });

  console.log(`\nSyncing term ${term}${skipInstructors ? ' (skip instructors)' : ''}...`);

  console.log('Fetching full catalog from Banner...');
  const rawSections = await fetchTermCatalogRaw(term);
  console.log(`  fetched ${rawSections.length} sections`);

  // Enrich instructors.
  const instructorByCrn = new Map<
    string,
    { name: string; email: string; location: string }
  >();
  if (!skipInstructors) {
    console.log('Enriching instructors (concurrency 4)...');
    let done = 0;
    await mapWithConcurrency(rawSections, 4, async (raw) => {
      const crn = String(raw.courseReferenceNumber);
      const faculty = await withRetry(
        () => getFacultyMeetingTimes(term, crn),
        2,
        `faculty ${crn}`
      );
      if (faculty) {
        instructorByCrn.set(crn, {
          name: primaryInstructorName(faculty),
          email: primaryInstructorEmail(faculty),
          location: meetingLocation(faculty),
        });
      }
      done++;
      if (done % 100 === 0 || done === rawSections.length) {
        console.log(`  instructors ${done}/${rawSections.length}`);
      }
    });
  }

  // Build rows.
  const rows = rawSections.map((raw) => {
    const info = instructorByCrn.get(String(raw.courseReferenceNumber));
    return buildRow(raw, info?.name ?? '', info?.email ?? '', info?.location);
  });

  // Upsert in batches of 500 via bulkWrite (filter {term, crn}).
  console.log(`Upserting ${rows.length} rows to Mongo (batches of 500)...`);
  const BATCH = 500;
  let upserted = 0;
  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const ops = batch.map((row) => ({
        updateOne: {
          filter: { term: row.term, crn: row.crn },
          update: { $set: row },
          upsert: true,
        },
      }));
      await collection.bulkWrite(ops, { ordered: false });
      upserted += batch.length;
      console.log(`  upserted ${upserted}/${rows.length}`);
    }
  } finally {
    await client.close();
  }

  console.log(`\nDone. Synced ${upserted} sections for term ${term}.\n`);
}

main().catch((e) => {
  console.error('Sync failed:', e);
  process.exit(1);
});
