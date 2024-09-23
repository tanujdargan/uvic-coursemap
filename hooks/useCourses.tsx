// hooks/useCourses.tsx
import { useState, useEffect } from 'react';
import { groupSectionsIntoCourses } from '@/utils/sectionUtils';
import { getCurrentTermCode } from '@/utils/termUtils';
import { Course, Section, Subject } from '@/utils/interfaces';

export function useCourses() {
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [progressValue, setProgressValue] = useState<number>(0);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data: Section[] = await response.json();

      const grouped = groupSectionsIntoCourses(data);
      setGroupedCourses(grouped);

      const uniqueSubjects = Array.from(new Set(grouped.map((course) => course.subject)));
      uniqueSubjects.sort();

      setSubjects(
        uniqueSubjects.map((subject) => ({
          id: subject,
          name: subject,
        }))
      );

      const uniqueTerms = Array.from(new Set(data.map((section) => section.term)));
      uniqueTerms.sort((a, b) => a - b);

      setTerms(uniqueTerms);

      const currentTermCode = getCurrentTermCode();
      const currentTermIndex = uniqueTerms.findIndex((term) => term >= currentTermCode);
      const defaultTermIndex = currentTermIndex !== -1 ? currentTermIndex : 0;
      setSelectedTerm(uniqueTerms[defaultTermIndex]?.toString() || '');
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 100 ? 0 : prev + 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  return {
    groupedCourses,
    subjects,
    terms,
    selectedTerm,
    setSelectedTerm,
    loading,
    progressValue,
  };
}