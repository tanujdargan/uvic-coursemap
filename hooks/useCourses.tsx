// hooks/useCourses.tsx
import { useState, useEffect } from 'react';
import { groupSectionsIntoCourses } from '@/utils/sectionUtils';
import { pickDefaultTerm } from '@/utils/termUtils';
import { Course, Section, Subject } from '@/utils/interfaces';

export interface TermOption {
  code: number;
  description: string;
  viewOnly: boolean;
}

export function useCourses() {
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<number[]>([]);
  const [termOptions, setTermOptions] = useState<TermOption[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // full-screen, initial only
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false); // per term switch
  const [progressValue, setProgressValue] = useState<number>(0);

  // 1. Load the list of terms once, then pick a sensible default term.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/terms');
        const data: { code: string; description: string; viewOnly?: boolean }[] =
          await res.json();
        if (cancelled) return;

        const opts: TermOption[] = (Array.isArray(data) ? data : [])
          .map((t) => ({
            code: parseInt(t.code, 10),
            description: t.description,
            viewOnly: !!t.viewOnly,
          }))
          .filter((t) => !Number.isNaN(t.code))
          .sort((a, b) => b.code - a.code); // newest first

        setTermOptions(opts);
        setTerms(opts.map((o) => o.code));

        // Default term = the nearest registerable term (e.g. Sep 2026 in July 2026, not Jan 2027).
        const picked = pickDefaultTerm(
          opts.map((o) => ({ ...o, code: String(o.code) }))
        );
        const def = picked ? opts.find((o) => String(o.code) === picked.code) : undefined;
        if (def) {
          setSelectedTerm(String(def.code));
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load the catalog for the selected term whenever it changes.
  useEffect(() => {
    if (!selectedTerm) return;
    let cancelled = false;

    (async () => {
      try {
        setCoursesLoading(true);
        const res = await fetch(
          `/api/courses?term=${encodeURIComponent(selectedTerm)}`
        );
        const data: Section[] = await res.json();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        const grouped = groupSectionsIntoCourses(list);
        setGroupedCourses(grouped);

        const uniqueSubjects = Array.from(
          new Set(grouped.map((course) => course.subject))
        ).sort();
        setSubjects(uniqueSubjects.map((subject) => ({ id: subject, name: subject })));
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (!cancelled) {
          setGroupedCourses([]);
          setSubjects([]);
        }
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
          setLoading(false); // clears the initial full-screen loader
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTerm]);

  // Indeterminate-style progress animation while loading.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setProgressValue(0);
      interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 100 ? 20 : prev + 10));
      }, 120);
    }
    return () => clearInterval(interval);
  }, [loading]);

  return {
    groupedCourses,
    subjects,
    terms,
    termOptions,
    selectedTerm,
    setSelectedTerm,
    loading,
    coursesLoading,
    progressValue,
  };
}
