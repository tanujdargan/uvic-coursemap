// components/explore/InstructorRating.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ExternalLink } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { IProfessorRating } from '@/utils/rateMyProfessor';

interface InstructorRatingProps {
  instructor: string;
  rating?: IProfessorRating;
}

function ratingColor(value: number): string {
  if (value < 0) return 'text-muted-foreground';
  if (value >= 4) return 'text-emerald-500';
  if (value >= 3) return 'text-amber-500';
  return 'text-red-500';
}

/**
 * Renders an instructor name. When empty/TBA it shows a muted "TBA".
 * Otherwise the name is a hover-card trigger that surfaces the
 * RateMyProfessors rating summary (or a graceful "no rating" message).
 */
export default function InstructorRating({
  instructor,
  rating,
}: InstructorRatingProps) {
  const name = instructor?.trim();

  if (!name || name === 'TBA') {
    return <span className="text-muted-foreground">TBA</span>;
  }

  const loading = rating === undefined;
  const hasRating = !!rating && rating.avgRating !== -1;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          {name}
          {hasRating && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold',
                ratingColor(rating.avgRating)
              )}
            >
              <Star className="h-3 w-3 fill-current" />
              {rating.avgRating.toFixed(1)}
            </span>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" align="start">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-tight">
                {rating?.formattedName || name}
              </p>
              {rating?.department && (
                <p className="text-xs text-muted-foreground">
                  {rating.department}
                </p>
              )}
            </div>
            {hasRating && (
              <span
                className={cn(
                  'flex items-center gap-1 text-lg font-bold',
                  ratingColor(rating.avgRating)
                )}
              >
                <Star className="h-4 w-4 fill-current" />
                {rating.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading rating…</p>
          ) : hasRating ? (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="text-right font-medium">
                  {typeof rating.avgDifficulty === 'number' &&
                  rating.avgDifficulty >= 0
                    ? `${rating.avgDifficulty.toFixed(1)} / 5`
                    : 'N/A'}
                </span>
                <span className="text-muted-foreground">Would take again</span>
                <span className="text-right font-medium">
                  {typeof rating.wouldTakeAgainPercent === 'number' &&
                  rating.wouldTakeAgainPercent >= 0
                    ? `${rating.wouldTakeAgainPercent.toFixed(0)}%`
                    : 'N/A'}
                </span>
                <span className="text-muted-foreground">Ratings</span>
                <span className="text-right font-medium">
                  {rating.numRatings}
                </span>
              </div>
              {rating.link && (
                <>
                  <Separator />
                  <Link
                    href={rating.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View on RateMyProfessors
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No RateMyProfessors rating found.
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
