'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// Import interfaces and utility functions
import { Course, Subject } from '../utils/interfaces';


// Define the props interface
interface LeftSidebarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedTerm: string;
  setSelectedTerm: React.Dispatch<React.SetStateAction<string>>;
  terms: number[];
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
  filteredSubjects,
  filteredCourses,
  handleCourseClick,
  convertTermToString,
}) => {
  return (
    <div className="w-full md:w-1/1 border-r border-surface-300 flex flex-col bg-surface-100 absolute md:relative z-10 left-0 top-0 h-full">
      <div className="p-4 border-b border-surface-300">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2 h-5 w-5 text-surface-500" />
          <Input
            type="search"
            placeholder="Search for courses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-surface-300 border-surface-400 text-white placeholder-surface-500 rounded-md"
          />
        </div>
        <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
          <SelectTrigger className="w-full bg-surface-300 border-surface-400 text-surface-text dark:text-white placeholder-surface-500 rounded-md">
            <SelectValue placeholder="Select a term" />
          </SelectTrigger>
          <SelectContent className="bg-surface-300">
            {terms.map((term) => (
              <SelectItem key={term} value={term.toString()}>
                {convertTermToString(term)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" className="w-full">
          {filteredSubjects.map((subject) => (
            <AccordionItem key={subject.id} value={subject.id}>
              <AccordionTrigger className="px-4 text-surface-text dark:text-white">
                {subject.name}
              </AccordionTrigger>
              <AccordionContent>
                {filteredCourses
                  .filter((course) => course.subject === subject.id)
                  .sort((a, b) => a.course_number - b.course_number)
                  .map((course) => (
                    <Button
                      key={`${course.subject}-${course.course_number}`}
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 text-sm text-surface-text dark:text-white"
                      onClick={() => handleCourseClick(course)}
                    >
                      {course.subject} {course.course_number}: {course.course_name}
                    </Button>
                  ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
};
export default LeftSidebar;