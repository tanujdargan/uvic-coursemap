// app/api/seat-capacity/route.ts
//
// GET /api/seat-capacity?term=X&crn=Y
//   -> { term, crn, data: { Seats: {Capacity,Actual,Remaining},
//                           Waitlist: {Capacity,Actual,Remaining} } }
// Numbers (not strings). Backed by Banner's live getEnrollmentInfo fragment.
// A tiny in-memory 30s cache absorbs the burst the explore page fires (one
// request per section of the selected course).

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getEnrollmentInfo, type EnrollmentInfo } from '@/lib/banner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  expires: number;
  data: EnrollmentInfo;
}

// Module-scoped cache (persists across requests within a warm server instance).
const cache = new Map<string, CacheEntry>();
// De-dupe concurrent identical lookups.
const inflight = new Map<string, Promise<EnrollmentInfo>>();

function getCached(key: string): EnrollmentInfo | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');
  const crn = searchParams.get('crn');

  if (!term || !crn) {
    return NextResponse.json(
      { error: 'Missing term or crn parameter' },
      { status: 400 }
    );
  }

  const key = `${term}:${crn}`;

  try {
    let data = getCached(key);

    if (!data) {
      let promise = inflight.get(key);
      if (!promise) {
        promise = getEnrollmentInfo(term, crn);
        inflight.set(key, promise);
        promise
          .then((result) => {
            cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: result });
          })
          .catch(() => {
            /* handled below */
          })
          .finally(() => {
            inflight.delete(key);
          });
      }
      data = await promise;
    }

    return NextResponse.json(
      { term, crn, data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching seat capacity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat capacity data' },
      { status: 502 }
    );
  }
}
