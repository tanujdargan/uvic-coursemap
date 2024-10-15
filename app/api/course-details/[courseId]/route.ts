import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Course-Data');

    // Fetch the course details from the 'CourseDetails' collection
    const courseDetail = await db
      .collection('CourseDetails')
      .findOne({ 'Course ID': courseId });

    if (!courseDetail) {
      return NextResponse.json({ error: 'Course details not found' }, { status: 404 });
    }

    const { _id, ...courseDetailWithoutId } = courseDetail;

    // Map the MongoDB fields to TypeScript-friendly property names
    const result = {
      pid: courseDetailWithoutId['PID'],
      courseId: courseDetailWithoutId['Course ID'],
      subjectCode: courseDetailWithoutId['Subject Code'],
      title: courseDetailWithoutId['Title'],
      description: courseDetailWithoutId['Description'],
      credits: courseDetailWithoutId['Credits'],
      prerequisites: courseDetailWithoutId['Prerequisites'],
      recommendations: courseDetailWithoutId['Recommendations'],
      notes: courseDetailWithoutId['Notes'],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrieving course details:', error);
    return NextResponse.json(
      { error: 'Error retrieving course details' },
      { status: 500 }
    );
  }
}