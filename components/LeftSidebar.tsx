// components/LeftSidebar.tsx

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookX } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { Course, Subject } from '../utils/interfaces';
import type { TermOption } from '@/hooks/useCourses';

interface LeftSidebarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedTerm: string;
  setSelectedTerm: React.Dispatch<React.SetStateAction<string>>;
  terms: number[];
  termOptions?: TermOption[];
  coursesLoading?: boolean;
  filteredSubjects: Subject[];
  filteredCourses: Course[];
  handleCourseClick: (course: Course) => void;
  convertTermToString: (termCode: number) => string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedTerm,
  setSelectedTerm,
  terms,
  termOptions,
  coursesLoading,
  filteredSubjects,
  filteredCourses,
  handleCourseClick,
  convertTermToString,
}) => {
  const options: TermOption[] =
    termOptions && termOptions.length > 0
      ? termOptions
      : terms.map((code) => ({
          code,
          description: convertTermToString(code),
          viewOnly: false,
        }));

  const hasResults = filteredSubjects.length > 0;

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="space-y-2.5 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={selectedTerm}
          onValueChange={(value) => setSelectedTerm(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a term" />
          </SelectTrigger>
          <SelectContent>
            {options.map((term) => (
              <SelectItem key={term.code} value={term.code.toString()}>
                <span className="flex items-center gap-2">
                  {convertTermToString(term.code)}
                  {term.viewOnly && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-normal"
                    >
                      View only
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {coursesLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : hasResults ? (
          <Accordion type="multiple" className="w-full px-1 py-1">
            {filteredSubjects.map((subject) => {
              const subjectCourses = filteredCourses
                .filter((course) => course.subject === subject.id)
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
                  <AccordionTrigger className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent hover:no-underline">
                    <span className="flex flex-1 items-center justify-between pr-2">
                      <span>{subject.name}</span>
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-[10px] font-normal"
                      >
                        {subjectCourses.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0">
                    <div className="space-y-0.5 pl-1">
                      {subjectCourses.map((course) => (
                        <Button
                          key={`${course.subject}-${course.course_code}`}
                          variant="ghost"
                          className="h-auto w-full justify-start whitespace-normal px-3 py-1.5 text-left text-sm font-normal leading-snug"
                          onClick={() => handleCourseClick(course)}
                        >
                          <span>
                            <span className="font-medium text-foreground">
                              {course.subject} {course.course_code}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}
                              — {course.course_name}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <BookX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No courses found
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different search term or term selection.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LeftSidebar;
