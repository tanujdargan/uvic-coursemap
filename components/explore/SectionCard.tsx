// components/explore/SectionCard.tsx
'use client';

import React from 'react';
import { Clock, CalendarDays, MapPin, Users, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Section } from '@/utils/interfaces';
import type { IProfessorRating } from '@/utils/rateMyProfessor';
import type { SeatData } from './types';
import InstructorRating from './InstructorRating';

interface SectionCardProps {
  section: Section;
  rating?: IProfessorRating;
  seats?: SeatData;
  seatsLoading?: boolean;
}

const scheduleTypeStyles: Record<string, string> = {
  Lecture: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300',
  Lab: 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300',
  Tutorial:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  Seminar:
    'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  Other: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
};

function SeatIndicator({
  seats,
  loading,
}: {
  seats?: SeatData;
  loading?: boolean;
}) {
  if (loading && !seats) {
    return <Skeleton className="h-5 w-28" />;
  }
  if (!seats) {
    return <span className="text-xs text-muted-foreground">Seats: —</span>;
  }

  const { Seats, Waitlist } = seats;
  const open = Seats.Remaining > 0;
  const waitlistOnly = !open && Waitlist.Remaining > 0;

  const dotColor = open
    ? 'bg-emerald-500'
    : waitlistOnly
    ? 'bg-amber-500'
    : 'bg-red-500';
  const textColor = open
    ? 'text-emerald-600 dark:text-emerald-400'
    : waitlistOnly
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className={cn('inline-flex items-center gap-1.5 font-medium', textColor)}>
        <span className={cn('h-2 w-2 rounded-full', dotColor)} />
        Seats {Seats.Actual}/{Seats.Capacity}
        <span className="font-normal text-muted-foreground">
          ({Seats.Remaining} open)
        </span>
      </span>
      {Waitlist.Capacity > 0 && (
        <span className="text-muted-foreground">
          Waitlist {Waitlist.Actual}/{Waitlist.Capacity}
        </span>
      )}
    </div>
  );
}

export default function SectionCard({
  section,
  rating,
  seats,
  seatsLoading,
}: SectionCardProps) {
  const badgeClass =
    scheduleTypeStyles[section.schedule_type] ?? scheduleTypeStyles.Other;

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('font-medium', badgeClass)}
            >
              {section.schedule_type || 'Other'}
            </Badge>
            <span className="text-sm font-semibold">
              Section {section.section}
            </span>
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            CRN {section.crn}
          </span>
        </div>

        {/* Meta rows */}
        <div className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">
              {section.time || 'TBA'}
              {section.days ? (
                <span className="ml-1 text-muted-foreground">
                  · {section.days}
                </span>
              ) : null}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{section.location || 'TBA'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">
              <InstructorRating instructor={section.instructor} rating={rating} />
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">
              {section.date_range || 'TBA'}
            </span>
          </div>
        </div>

        {/* Footer: units, method, seats */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {section.units} {section.units === 1 ? 'unit' : 'units'}
            </span>
            {section.instructional_method && (
              <span>{section.instructional_method}</span>
            )}
          </div>
          <SeatIndicator seats={seats} loading={seatsLoading} />
        </div>

        {section.additional_information && (
          <p className="text-xs text-muted-foreground">
            {section.additional_information}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
