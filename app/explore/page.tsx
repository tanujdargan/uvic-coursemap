// app/explore/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  BookOpen,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import TopBar from '@/components/TopBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  Section,
  Course,
  Subject,
  CourseDetails,
} from '@/utils/interfaces';
import type { IProfessorRating } from '@/utils/rateMyProfessor';
import { pickDefaultTerm } from '@/utils/termUtils';

import SectionCard from '@/components/explore/SectionCard';
import type { Term, SeatData } from '@/components/explore/types';

const SCHEDULE_ORDER = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function groupSectionsIntoCourses(sections: Section[]): Course[] {
  const map: Record<string, Course> = {};
  for (const section of sections) {
    const courseCode = section.course_code || String(section.course_number);
    const key = `${section.subject}-${courseCode}`;
    if (!map[key]) {
      map[key] = {
        subject: section.subject,
        course_number: section.course_number,
        course_code: courseCode,
        course_name: section.course_name,
        sections: [section],
      };
    } else {
      map[key].sections.push(section);
    }
  }
  return Object.values(map);
}

/** Run async tasks with a bounded number of concurrent workers. */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (next === undefined) break;
      await worker(next);
    }
  });
  await Promise.all(runners);
}

/* ------------------------------------------------------------------ */
/* Sidebar skeleton                                                    */
/* ------------------------------------------------------------------ */

function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ExplorePage() {
  // Term state
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [termsLoading, setTermsLoading] = useState(true);

  // Course state
  const [groupedCourses, setGroupedCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(false);

  // Selection / search
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Course details
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Ancillary data
  const [ratingsCache, setRatingsCache] = useState<Record<string, IProfessorRating>>({});
  const [seatCapacities, setSeatCapacities] = useState<Record<number, SeatData>>({});
  const [seatsLoading, setSeatsLoading] = useState(false);

  // Layout
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Guards against stale async writes when term changes quickly.
  const activeTermRef = useRef<string>('');
  // Monotonic id identifying the latest seat-fetch effect run, so a superseded
  // run never clears the loading flag out from under a newer one.
  const seatReqRef = useRef<number>(0);

  /* --------------------- responsive --------------------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* --------------------- fetch terms --------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTermsLoading(true);
        const res = await fetch('/api/terms');
        if (!res.ok) throw new Error(`Terms request failed (${res.status})`);
        const data: Term[] = await res.json();
        if (cancelled) return;
        setTerms(data);
        // Default to the nearest registerable term (e.g. Sep 2026 in July 2026, not Jan 2027).
        const def = pickDefaultTerm(data);
        if (def) setSelectedTerm(def.code);
      } catch (err) {
        console.error('Error fetching terms:', err);
        if (!cancelled) toast.error('Could not load terms. Please try again.');
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* --------------------- fetch courses (per term) --------------------- */
  const fetchCourses = useCallback(async (term: string) => {
    if (!term) return;
    activeTermRef.current = term;
    setCoursesLoading(true);
    setCoursesError(false);
    setSelectedCourse(null);
    setCourseDetails(null);
    try {
      const res = await fetch(`/api/courses?term=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error(`Courses request failed (${res.status})`);
      const data: Section[] = await res.json();
      // Ignore if the user switched terms mid-flight.
      if (activeTermRef.current !== term) return;

      const grouped = groupSectionsIntoCourses(data);
      grouped.sort(
        (a, b) =>
          a.subject.localeCompare(b.subject) ||
          a.course_number - b.course_number ||
          a.course_code.localeCompare(b.course_code)
      );
      setGroupedCourses(grouped);

      const uniqueSubjects = Array.from(
        new Set(grouped.map((c) => c.subject))
      ).sort();
      setSubjects(uniqueSubjects.map((s) => ({ id: s, name: s })));
    } catch (err) {
      console.error('Error fetching courses:', err);
      if (activeTermRef.current === term) {
        setCoursesError(true);
        setGroupedCourses([]);
        setSubjects([]);
        toast.error('Could not load courses for this term.');
      }
    } finally {
      if (activeTermRef.current === term) setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTerm) fetchCourses(selectedTerm);
  }, [selectedTerm, fetchCourses]);

  /* --------------------- course details --------------------- */
  useEffect(() => {
    if (!selectedCourse) {
      setCourseDetails(null);
      return;
    }
    let cancelled = false;
    const courseId = `${selectedCourse.subject}${selectedCourse.course_code}`;
    (async () => {
      setDetailsLoading(true);
      setCourseDetails(null);
      try {
        const res = await fetch(
          `/api/course-details/${encodeURIComponent(courseId)}`
        );
        if (cancelled) return;
        if (res.ok) {
          setCourseDetails(await res.json());
        } else {
          // 404 is expected for many courses — degrade gracefully.
          setCourseDetails(null);
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        if (!cancelled) setCourseDetails(null);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse]);

  /* --------------------- professor ratings --------------------- */
  useEffect(() => {
    if (!selectedCourse) return;
    let cancelled = false;

    const names = Array.from(
      new Set(
        selectedCourse.sections
          .map((s) => s.instructor.trim())
          .filter((n) => n && n !== 'TBA')
      )
    ).filter((n) => !ratingsCache[n]);

    if (names.length === 0) return;

    const fallback = (name: string): IProfessorRating => ({
      avgRating: -1,
      avgDifficulty: -1,
      wouldTakeAgainPercent: -1,
      numRatings: 0,
      formattedName: name,
      department: '',
      link: '',
    });

    runWithConcurrency(names, 4, async (name) => {
      try {
        const res = await fetch(`/api/ratings/${encodeURIComponent(name)}`);
        const data: IProfessorRating = res.ok ? await res.json() : fallback(name);
        if (!cancelled) {
          setRatingsCache((prev) => ({ ...prev, [name]: data }));
        }
      } catch (err) {
        console.error(`Error fetching rating for ${name}:`, err);
        if (!cancelled) {
          setRatingsCache((prev) => ({ ...prev, [name]: fallback(name) }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  /* --------------------- seat capacity (lazy, capped) --------------------- */
  useEffect(() => {
    // A new run always supersedes any in-flight one.
    const reqId = ++seatReqRef.current;

    if (!selectedCourse) {
      setSeatsLoading(false);
      return;
    }

    const crns = Array.from(
      new Set(selectedCourse.sections.map((s) => s.crn))
    ).filter((crn) => !seatCapacities[crn]);

    const term = selectedCourse.sections[0]?.term;

    // Nothing to fetch (all cached, or no term) — make sure loading is cleared
    // even if a previous run left the flag set.
    if (crns.length === 0 || term === undefined) {
      setSeatsLoading(false);
      return;
    }

    setSeatsLoading(true);
    runWithConcurrency(crns, 5, async (crn) => {
      try {
        const res = await fetch(`/api/seat-capacity?term=${term}&crn=${crn}`);
        if (!res.ok) return;
        const json = await res.json();
        // Ignore results from a superseded run.
        if (seatReqRef.current === reqId && json?.data) {
          setSeatCapacities((prev) => ({ ...prev, [crn]: json.data }));
        }
      } catch (err) {
        console.error(`Error fetching seats for CRN ${crn}:`, err);
      }
    }).finally(() => {
      // Only the latest run may clear the flag.
      if (seatReqRef.current === reqId) setSeatsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  /* --------------------- filtering --------------------- */
  const searchWords = useMemo(
    () => searchTerm.toLowerCase().split(' ').filter(Boolean),
    [searchTerm]
  );

  const filteredCourses = useMemo(() => {
    if (searchWords.length === 0) return groupedCourses;
    return groupedCourses.filter((course) => {
      const haystack =
        `${course.subject} ${course.course_code} ${course.course_name}`.toLowerCase();
      return searchWords.every((w) => haystack.includes(w));
    });
  }, [groupedCourses, searchWords]);

  const coursesBySubject = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const course of filteredCourses) {
      (map[course.subject] ??= []).push(course);
    }
    return map;
  }, [filteredCourses]);

  const filteredSubjects = useMemo(() => {
    const withMatches = new Set(Object.keys(coursesBySubject));
    return subjects.filter(
      (s) =>
        withMatches.has(s.id) ||
        (searchWords.length > 0 &&
          s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [subjects, coursesBySubject, searchWords, searchTerm]);

  /* --------------------- render helpers --------------------- */
  const renderSidebarBody = () => {
    if (coursesLoading) return <SidebarSkeleton />;
    if (coursesError) {
      return (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Failed to load courses.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchCourses(selectedTerm)}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }
    if (filteredSubjects.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? `No courses match “${searchTerm}”.`
              : 'No courses available for this term.'}
          </p>
        </div>
      );
    }
    return (
      <Accordion type="single" collapsible className="w-full px-2 py-2">
        {filteredSubjects.map((subject) => {
          const courses = (coursesBySubject[subject.id] ?? [])
            .slice()
            .sort(
              (a, b) =>
                a.course_number - b.course_number ||
                a.course_code.localeCompare(b.course_code)
            );
          return (
            <AccordionItem
              key={subject.id}
              value={subject.id}
              className="border-b-0"
            >
              <AccordionTrigger className="rounded-md px-2 py-2 text-sm font-semibold hover:bg-muted/60 hover:no-underline">
                <span className="flex items-center gap-2">
                  {subject.name}
                  <Badge variant="secondary" className="font-normal">
                    {courses.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="flex flex-col gap-0.5">
                  {courses.map((course) => {
                    const isActive =
                      selectedCourse?.subject === course.subject &&
                      selectedCourse?.course_code === course.course_code;
                    return (
                      <button
                        key={`${course.subject}-${course.course_code}`}
                        onClick={() => setSelectedCourse(course)}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <span className="font-medium text-foreground">
                          {course.subject} {course.course_code}
                        </span>
                        <span className="ml-1 text-muted-foreground">
                          {course.course_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  const renderDetail = () => {
    if (!selectedCourse) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            Select a course to view its sections
          </p>
          <p className="max-w-sm text-sm text-muted-foreground/70">
            Browse subjects on the left, or search by subject, course number, or
            name.
          </p>
        </div>
      );
    }

    const sectionsForTerm = selectedCourse.sections;

    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Course header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedCourse.subject} {selectedCourse.course_code}
            </h1>
            {courseDetails?.credits ? (
              <Badge variant="secondary">
                {courseDetails.credits}{' '}
                {courseDetails.credits === 1 ? 'credit' : 'credits'}
              </Badge>
            ) : null}
          </div>
          <p className="text-lg text-muted-foreground">
            {selectedCourse.course_name}
          </p>
        </div>

        {/* Details */}
        {detailsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : courseDetails ? (
          <div className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-4 text-sm">
            {courseDetails.description && (
              <p className="leading-relaxed text-foreground/90">
                {courseDetails.description}
              </p>
            )}
            {(courseDetails.prerequisites ||
              courseDetails.recommendations ||
              courseDetails.notes) && <Separator />}
            {courseDetails.prerequisites && (
              <p>
                <span className="font-semibold">Prerequisites: </span>
                <span className="text-muted-foreground">
                  {courseDetails.prerequisites}
                </span>
              </p>
            )}
            {courseDetails.recommendations && (
              <p>
                <span className="font-semibold">Recommendations: </span>
                <span className="text-muted-foreground">
                  {courseDetails.recommendations}
                </span>
              </p>
            )}
            {courseDetails.notes && (
              <p>
                <span className="font-semibold">Notes: </span>
                <span className="text-muted-foreground">
                  {courseDetails.notes}
                </span>
              </p>
            )}
          </div>
        ) : null}

        {/* Sections grouped by schedule type */}
        {SCHEDULE_ORDER.map((type) => {
          const sectionsOfType = sectionsForTerm
            .filter((s) => (s.schedule_type || 'Other') === type)
            .sort((a, b) => a.section.localeCompare(b.section));
          if (sectionsOfType.length === 0) return null;
          return (
            <div key={type} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-4 w-4" />
                {type}
                <span className="text-muted-foreground/60">
                  ({sectionsOfType.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {sectionsOfType.map((section) => (
                  <SectionCard
                    key={section.crn}
                    section={section}
                    rating={
                      section.instructor
                        ? ratingsCache[section.instructor.trim()]
                        : undefined
                    }
                    seats={seatCapacities[section.crn]}
                    seatsLoading={seatsLoading}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* --------------------- layout --------------------- */
  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <TopBar
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTopBarVisible={true}
      />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <aside className="flex w-full max-w-xs flex-col border-r border-border/60 bg-muted/20 md:w-80 lg:w-96">
          <div className="space-y-3 border-b border-border/60 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses or subjects…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              disabled={termsLoading || terms.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={termsLoading ? 'Loading terms…' : 'Select a term'}
                />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.code} value={term.code}>
                    {term.description}
                    {term.viewOnly ? ' (View Only)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">{renderSidebarBody()}</ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {coursesLoading && !selectedCourse ? (
              <DetailSkeleton />
            ) : (
              renderDetail()
            )}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
