// components/RightSidebar.tsx

'use client';

import React from 'react';
import { Section, Course } from '../utils/interfaces';

interface RightSidebarProps {
  selectedCourse: Course | null;
  selectedTerm: string;
  selectedSectionsByType: { [type: string]: Section | null };
  handleSectionSelection: (type: string, crnValue: string) => void;
  handleExportICS: () => void;
  handleSaveTimetable: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedCourse,
  selectedTerm,
  selectedSectionsByType,
  handleSectionSelection,
  handleExportICS,
  handleSaveTimetable,
}) => {
  return (
    <div className="bg-surface-200 h-full p-4 overflow-y-auto">
      {selectedCourse ? (
        <>
          <h2 className="text-xl font-bold mb-4">
            {selectedCourse.subject} {selectedCourse.course_number}
          </h2>
          {['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'].map((type) => {
            const sectionsOfType = selectedCourse.sections
              .filter(
                (section) =>
                  section.schedule_type === type && section.term === parseInt(selectedTerm)
              )
              .sort((a, b) => a.section.localeCompare(b.section));

            if (sectionsOfType.length === 0) {
              return null;
            }
            return (
              <div key={type} className="mb-4">
                <label className="block text-sm font-medium mb-1">{type}:</label>
                <div className="space-y-2">
                  {sectionsOfType.map((section) => (
                    <label key={section.crn} className="flex items-center">
                      <input
                        type="radio"
                        name={`${type}-section`}
                        value={section.crn}
                        checked={selectedSectionsByType[type]?.crn === section.crn}
                        onChange={(e) => handleSectionSelection(type, e.target.value)}
                      />
                      <span className="ml-2">
                        Section {section.section} ({section.days} {section.time})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <p className="text-center">Select a course to view sections</p>
      )}
      {/* Save Timetable Button */}
      <button
        className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded"
        onClick={handleSaveTimetable}
      >
        Save Timetable
      </button>
      {/* Export to ICS Button */}
      <button
        className="mt-2 w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded"
        onClick={handleExportICS}
      >
        Export to .ics
      </button>
    </div>
  );
};
export default RightSidebar;