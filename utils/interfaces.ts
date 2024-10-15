// utils/interfaces.ts

export interface Section {
  term: number;
  subject: string;
  course_name: string;
  course_number: number;
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