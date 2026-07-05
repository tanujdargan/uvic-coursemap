// lib/mongodb.ts
//
// Lazy MongoDB client factory.
//
//  - getMongoClient() : returns a connected MongoClient, throwing a clear
//                       error ONLY when a connection is actually requested and
//                       MONGODB_URI is missing. Importing this module never
//                       throws, so the app builds/runs without Mongo and API
//                       routes can degrade to live Banner data.
//  - getSectionsDb()  : convenience accessor for the "Course-Data" database.
//
// In development we cache the client promise on globalThis so hot-reload does
// not open a new connection on every change (standard Next.js pattern).

import { MongoClient, type Db } from 'mongodb';

export const MONGO_DB_NAME = 'Course-Data';
export const SECTIONS_COLLECTION = 'sections';

let clientPromise: Promise<MongoClient> | null = null;

// Reuse a single client promise across hot reloads in dev.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

/**
 * Connect (lazily) and return a MongoClient. Throws a clear error only when
 * called without MONGODB_URI set — never at module import time.
 */
export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local to enable the MongoDB ' +
        'catalog cache (Course-Data.sections). Without it the app serves live ' +
        'Banner data.'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    if (!globalForMongo._mongoClientPromise) {
      globalForMongo._mongoClientPromise = new MongoClient(uri).connect();
    }
    return globalForMongo._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

/** The "Course-Data" database. Throws (via getMongoClient) if MONGODB_URI is missing. */
export async function getCourseDataDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(MONGO_DB_NAME);
}
