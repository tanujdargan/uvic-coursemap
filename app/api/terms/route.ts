// app/api/terms/route.ts
//
// GET /api/terms -> [{ code, description, viewOnly }]
// Proxies Banner getTerms. "(View Only)" terms are flagged viewOnly:true but
// still returned. Cached ~1 day.

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getTerms } from '@/lib/banner';

export const runtime = 'nodejs';
export const revalidate = 86400; // 1 day

interface TermResponse {
  code: string;
  description: string;
  viewOnly: boolean;
}

const loadTerms = unstable_cache(
  async (): Promise<TermResponse[]> => {
    const terms = await getTerms();
    return terms.map((t) => {
      const viewOnly = /\(view only\)/i.test(t.description);
      return {
        code: t.code,
        description: t.description.replace(/\s*\(view only\)\s*/i, '').trim(),
        viewOnly,
      };
    });
  },
  ['banner-terms'],
  { revalidate: 86400, tags: ['terms'] }
);

export async function GET() {
  try {
    const terms = await loadTerms();
    return NextResponse.json(terms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 502 }
    );
  }
}
