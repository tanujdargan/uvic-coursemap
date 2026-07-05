// components/explore/types.ts
// Shared types for the course explorer feature.

export interface Term {
  code: string;
  description: string;
  viewOnly?: boolean;
}

export interface SeatBucket {
  Capacity: number;
  Actual: number;
  Remaining: number;
}

export interface SeatData {
  Seats: SeatBucket;
  Waitlist: SeatBucket;
}
