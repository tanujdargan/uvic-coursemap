// app/api/ratings/[professorName]/route.ts

import { NextResponse } from 'next/server';
import { getProfessorRatingAtSchoolId } from '@/utils/rateMyProfessor';

export async function GET(
  request: Request,
  { params }: { params: { professorName: string } }
) {
  //console.log('Request received at /api/ratings/[professorName]');
  try {
    const { professorName } = params;
    //console.log('Professor name parameter:', professorName);

    // URL decode the professor's name
    const decodedName = decodeURIComponent(professorName);
    //console.log('Decoded professor name:', decodedName);

    // UVic's Rate My Professor school ID
    const uvicSchoolId = 'U2Nob29sLTE0ODg='; // Correct Base64-encoded ID for UVic
    //console.log('Using school ID:', uvicSchoolId);

    // Fetch the professor's rating
    const rating = await getProfessorRatingAtSchoolId(decodedName, uvicSchoolId);
    //console.log('Fetched rating:', rating);

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error fetching professor rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professor rating' },
      { status: 500 }
    );
  }
}
