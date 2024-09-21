'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, Radio } from '@nextui-org/react';

// Import interfaces
interface Section {
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
}

interface Course {
  subject: string;
  course_number: number;
  course_name: string;
  sections: Section[];
}

interface RightSidebarProps {
  selectedCourse: Course | null;
  selectedTerm: string;
  selectedSectionsByType: { [type: string]: Section | null };
  handleSectionSelection: (type: string, crnValue: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedCourse,
  selectedTerm,
  selectedSectionsByType,
  handleSectionSelection,
}) => {
  return (
    <div className="w-full md:w-1/4 border-l border-surface-100 p-4 absolute md:relative z-10 right-0 top-0 h-full bg-surface-100">
      {selectedCourse ? (
        <div className="flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">
            {selectedCourse.subject} {selectedCourse.course_number}
          </h2>
          <p className="mb-4">{selectedCourse.course_name}</p>
          <ScrollArea className="flex-1">
            {['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'].map((type) => {
              const sectionsOfType = selectedCourse.sections
                .filter(
                  (section) =>
                    section.schedule_type === type &&
                    (selectedTerm ? section.term === parseInt(selectedTerm) : true)
                )
                .sort((a, b) => a.section.localeCompare(b.section));

              if (sectionsOfType.length === 0) return null;

              return (
                <div key={type} className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{type}s</h3>
                  <RadioGroup
                    orientation="vertical"
                    value={selectedSectionsByType[type]?.crn.toString() || ''}
                    onValueChange={(value) => handleSectionSelection(type, value)}
                  >
                    {sectionsOfType.map((section) => (
                      <Radio key={section.crn} value={section.crn.toString()}>
                        Section {section.section} - {section.days} {section.time}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-surface-400 text-xl">Select a course to view sections</p>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;