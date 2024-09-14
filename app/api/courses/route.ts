// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Connect to the MongoDB cluster
    const client = await clientPromise;
    const db = client.db('Course-Data'); // Replace with your database name

    // Fetch the data from the collection
    const courses = await db
      .collection('tillSpring2025') // Replace with your collection name
      .find({})
      .toArray();

    // Return the data as JSON
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    return NextResponse.json(
      { error: 'Error retrieving courses' },
      { status: 500 }
    );
  }
}