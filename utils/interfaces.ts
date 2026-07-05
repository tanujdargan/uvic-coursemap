// utils/interfaces.ts

export interface Section {
  term: number;
  subject: string;
  course_name: string;
  course_number: number;
  // Raw Banner course number, preserving any letter suffix (e.g. "370A",
  // "499B"). Equals String(course_number) for plain numeric courses. Used as
  // the canonical course-identity key; course_number is kept for numeric sort.
  course_code: string;
  crn: number;
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
  additional_information?: string;
}

export interface Course {
  subject: string;
  course_number: number;
  // Raw Banner course number preserving letter suffixes (e.g. "370A"). This is
  // the identity key that distinguishes AHVS 370A from AHVS 370G.
  course_code: string;
  course_name: string;
  sections: Section[];
}

export interface Subject {
  id: string;
  name: string;
}

export interface CourseDetails {
  pid: string;
  courseId: string;
  subjectCode: string;
  title: string;
  description: string;
  credits: number;
  prerequisites?: string;
  recommendations?: string;
  notes?: string;
}