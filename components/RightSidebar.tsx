// components/RightSidebar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Section, Course, CourseDetails } from '../utils/interfaces';
import { IProfessorRating } from '@/utils/rateMyProfessor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  Plus,
  Save,
  Star,
  Trash2,
  Users,
} from 'lucide-react';

interface RightSidebarProps {
  selectedCourse: Course | null;
  selectedTerm: string;
  selectedSectionsByType: { [type: string]: Section | null };
  handleSectionSelection: (type: string, crnValue: string) => void;
  handleExportICS: () => void;
  handleSaveTimetable: (timetableName: string) => void;
  handleDeleteTimetable: (timetableName: string) => void;
  timetables: any[];
  currentTimetableName: string;
  setCurrentTimetableName: (name: string) => void;
  loadTimetable: (name: string) => void;
  createNewTimetable: () => void;
  handleDeleteCourse: (courseToDelete: Course) => void;
  seatData: any;
  isFetchingSeatData: boolean;
  seatDataError: string | null;
  showAllLabs: boolean;
  setShowAllLabs: React.Dispatch<React.SetStateAction<boolean>>;
}

const SECTION_TYPES = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'];

/** Color-coded badge for a remaining-count value. */
function AvailabilityBadge({
  remaining,
  label,
}: {
  remaining: number;
  label: string;
}) {
  const tone =
    remaining <= 0
      ? 'bg-destructive/15 text-destructive border-destructive/30'
      : remaining <= 10
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
        tone
      )}
    >
      {remaining <= 0 ? 'Full' : `${remaining} ${label}`}
    </span>
  );
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedCourse,
  selectedTerm,
  selectedSectionsByType,
  handleSectionSelection,
  handleExportICS,
  handleSaveTimetable,
  handleDeleteTimetable,
  timetables,
  currentTimetableName,
  setCurrentTimetableName,
  loadTimetable,
  createNewTimetable,
  handleDeleteCourse,
  seatData,
  isFetchingSeatData,
  seatDataError,
  showAllLabs,
  setShowAllLabs,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timetableNameInput, setTimetableNameInput] = useState(currentTimetableName);
  const [professorRating, setProfessorRating] = useState<IProfessorRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

  useEffect(() => {
    setTimetableNameInput(currentTimetableName);
  }, [currentTimetableName]);

  useEffect(() => {
    let cancelled = false;
    const fetchProfessorRating = async (instructorName: string) => {
      if (!instructorName || instructorName.trim() === '') {
        setProfessorRating(null);
        return;
      }
      setRatingLoading(true);
      try {
        const response = await fetch(
          `/api/ratings/${encodeURIComponent(instructorName)}`
        );
        if (cancelled) return;
        if (response.ok) {
          const data: IProfessorRating = await response.json();
          setProfessorRating(data);
        } else {
          setProfessorRating({
            avgRating: -1,
            avgDifficulty: -1,
            wouldTakeAgainPercent: -1,
            numRatings: 0,
            formattedName: instructorName,
            department: '',
            link: '',
          });
        }
      } catch (error) {
        if (cancelled) return;
        setProfessorRating({
          avgRating: -1,
          avgDifficulty: -1,
          wouldTakeAgainPercent: -1,
          numRatings: 0,
          formattedName: instructorName,
          department: '',
          link: '',
        });
      } finally {
        if (!cancelled) setRatingLoading(false);
      }
    };

    if (selectedCourse && selectedCourse.sections.length > 0) {
      fetchProfessorRating(selectedCourse.sections[0].instructor);
    } else {
      setProfessorRating(null);
    }
    return () => {
      cancelled = true;
    };
  }, [selectedCourse]);

  useEffect(() => {
    let cancelled = false;
    const fetchCourseDetails = async (courseId: string) => {
      try {
        const response = await fetch(
          `/api/course-details/${encodeURIComponent(courseId)}`
        );
        if (cancelled) return;
        if (response.ok) {
          const data: CourseDetails = await response.json();
          setCourseDetails(data);
        } else {
          // Degrade gracefully (e.g. 404) — just hide the description panel.
          setCourseDetails(null);
        }
      } catch (error) {
        if (!cancelled) setCourseDetails(null);
      }
    };

    if (selectedCourse) {
      fetchCourseDetails(`${selectedCourse.subject}${selectedCourse.course_code}`);
    } else {
      setCourseDetails(null);
    }
    return () => {
      cancelled = true;
    };
  }, [selectedCourse]);

  // ---- Empty state -------------------------------------------------------
  if (!selectedCourse) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 border-l border-border bg-card px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No course selected</p>
        <p className="max-w-[16rem] text-xs text-muted-foreground">
          Pick a course from the catalog on the left to view its sections, seat
          availability, and professor ratings.
        </p>
      </div>
    );
  }

  const firstSection = selectedCourse.sections[0];
  const instructor =
    firstSection?.instructor && firstSection.instructor.trim() !== ''
      ? firstSection.instructor
      : 'TBA';

  const hasRmp = professorRating && professorRating.avgRating !== -1;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-l border-border bg-card">
      <div className="space-y-5 p-4">
        {/* Course header */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {selectedCourse.subject} {selectedCourse.course_code}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCourse.course_name}
              </p>
            </div>
            {firstSection && (
              <Badge variant="secondary" className="shrink-0">
                {firstSection.units} {firstSection.units === 1 ? 'unit' : 'units'}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" className="gap-1 font-normal">
              <GraduationCap className="h-3 w-3" /> {instructor}
            </Badge>
            {firstSection?.instructional_method && (
              <Badge variant="outline" className="font-normal">
                {firstSection.instructional_method}
              </Badge>
            )}
          </div>
        </div>

        {/* Professor rating */}
        {ratingLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : hasRmp ? (
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                RateMyProfessor
              </span>
              {professorRating?.link && (
                <a
                  href={professorRating.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Profile <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-base font-bold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {typeof professorRating?.avgRating === 'number' &&
                  professorRating.avgRating >= 0
                    ? professorRating.avgRating.toFixed(1)
                    : 'N/A'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Rating
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-foreground">
                  {typeof professorRating?.avgDifficulty === 'number' &&
                  professorRating.avgDifficulty >= 0
                    ? professorRating.avgDifficulty.toFixed(1)
                    : 'N/A'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Difficulty
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-foreground">
                  {typeof professorRating?.wouldTakeAgainPercent === 'number' &&
                  professorRating.wouldTakeAgainPercent >= 0
                    ? `${professorRating.wouldTakeAgainPercent.toFixed(0)}%`
                    : 'N/A'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Retake
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Based on {professorRating?.numRatings} ratings
            </p>
          </div>
        ) : null}

        {/* Details toggle */}
        <div>
          <button
            className="flex w-full items-center justify-between rounded-md py-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
          >
            <span>Course details</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showDetails && 'rotate-180'
              )}
            />
          </button>
          {showDetails && (
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-background/50 p-3 text-sm">
              <DetailRow label="CRN" value={firstSection?.crn} />
              <DetailRow label="Units" value={firstSection?.units} />
              <DetailRow
                label="Method"
                value={firstSection?.instructional_method}
              />
              {firstSection?.additional_information && (
                <DetailRow
                  label="Info"
                  value={firstSection.additional_information}
                />
              )}
              {courseDetails?.description && (
                <div className="pt-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">
                    {courseDetails.description}
                  </p>
                </div>
              )}
              {courseDetails?.prerequisites && (
                <DetailRow
                  label="Prerequisites"
                  value={courseDetails.prerequisites}
                />
              )}
              {courseDetails?.recommendations && (
                <DetailRow
                  label="Recommendations"
                  value={courseDetails.recommendations}
                />
              )}
              {courseDetails?.notes && (
                <DetailRow label="Notes" value={courseDetails.notes} />
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Section selection */}
        <div className="space-y-4">
          {SECTION_TYPES.map((type) => {
            const sectionsOfType = selectedCourse.sections
              .filter(
                (section) =>
                  section.schedule_type === type &&
                  section.term === parseInt(selectedTerm)
              )
              .sort((a, b) => a.section.localeCompare(b.section));

            if (sectionsOfType.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {type}
                </p>
                <div
                  role="radiogroup"
                  aria-label={`${type} sections`}
                  className="space-y-1.5"
                >
                  {sectionsOfType.map((section) => {
                    const selected =
                      selectedSectionsByType[type]?.crn === section.crn;
                    return (
                      <button
                        key={section.crn}
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          handleSectionSelection(type, section.crn.toString())
                        }
                        className={cn(
                          'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background/40 hover:border-border hover:bg-accent'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            selected
                              ? 'border-primary'
                              : 'border-muted-foreground/40'
                          )}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">
                              Section {section.section}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                              {section.crn}
                            </span>
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {section.days && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {section.days}
                              </span>
                            )}
                            {section.time && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {section.time}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Show all labs toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
            <Label
              htmlFor="show-all-labs"
              className="cursor-pointer text-sm font-normal leading-snug"
            >
              Preview all Lab / Tutorial sections
            </Label>
            <Switch
              id="show-all-labs"
              checked={showAllLabs}
              onCheckedChange={(checked) => setShowAllLabs(checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Seat availability */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Seat availability
            </h3>
          </div>
          {isFetchingSeatData ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : seatDataError ? (
            <p className="text-xs text-destructive">{seatDataError}</p>
          ) : seatData?.data ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Seats
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {seatData.data.Seats.Actual} / {seatData.data.Seats.Capacity}
                </p>
                <div className="mt-1">
                  <AvailabilityBadge
                    remaining={seatData.data.Seats.Remaining}
                    label="open"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Waitlist
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {seatData.data.Waitlist.Actual} /{' '}
                  {seatData.data.Waitlist.Capacity}
                </p>
                <div className="mt-1">
                  <AvailabilityBadge
                    remaining={seatData.data.Waitlist.Remaining}
                    label="open"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a section to load live seat data.
            </p>
          )}
        </div>

        <Separator />

        {/* Timetable management */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="timetable-name">Timetable name</Label>
            <Input
              id="timetable-name"
              value={timetableNameInput}
              onChange={(e) => setTimetableNameInput(e.target.value)}
              placeholder="My Timetable"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => handleSaveTimetable(timetableNameInput)}
          >
            <Save className="mr-2 h-4 w-4" /> Save timetable
          </Button>

          {timetables.length > 0 && (
            <div className="space-y-1.5">
              <Label>Saved timetables</Label>
              <Select value={currentTimetableName} onValueChange={loadTimetable}>
                <SelectTrigger>
                  <SelectValue placeholder="Load a timetable" />
                </SelectTrigger>
                <SelectContent>
                  {timetables.map((tt) => (
                    <SelectItem key={tt.name} value={tt.name}>
                      {tt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={createNewTimetable}>
              <Plus className="mr-1.5 h-4 w-4" /> New
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeleteTimetable(timetableNameInput)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          </div>

          <Button variant="outline" className="w-full" onClick={handleExportICS}>
            <Download className="mr-2 h-4 w-4" /> Export to .ics
          </Button>

          <Separator />

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => handleDeleteCourse(selectedCourse)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove {selectedCourse.subject}{' '}
            {selectedCourse.course_code}
          </Button>
        </div>
      </div>
    </div>
  );
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="shrink-0 font-semibold text-muted-foreground">
        {label}:
      </span>
      <span className="text-foreground/90">{value}</span>
    </div>
  );
}

export default RightSidebar;
