// components/RightSidebar.tsx

'use client';

import React, { useState } from 'react';
import { Section, Course } from '../utils/interfaces';

interface RightSidebarProps {
  selectedCourse: Course | null;
  selectedTerm: string;
  selectedSectionsByType: { [type: string]: Section | null };
  handleSectionSelection: (type: string, crnValue: string) => void;
  handleExportICS: () => void;
  handleSaveTimetable: (timetableName: string) => void;
  handleDeleteTimetable: () => void;
  timetables: any[];
  currentTimetableName: string;
  setCurrentTimetableName: React.Dispatch<React.SetStateAction<string>>;
  loadTimetable: (name: string) => void;
  createNewTimetable: () => void;
}

const deleteTimetable = (timetableName: string) => {
  // Your delete logic here
  console.log(`Deleting timetable: ${timetableName}`);
};

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
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timetableNameInput, setTimetableNameInput] = useState(currentTimetableName);

  return (
    <div className="bg-surface-200 h-full p-4 overflow-y-auto">
      {selectedCourse ? (
        <>
          <h2 className="text-xl font-bold mb-2">
            {selectedCourse.subject} {selectedCourse.course_number}
          </h2>
          <h3 className="text-lg font-semibold mb-2">{selectedCourse.course_name}</h3>

          {/* View Details Toggle */}
          <button
            className="text-sm text-blue-500 hover:underline mb-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>

          {/* Details Section */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showDetails ? 'max-h-96' : 'max-h-0'
            }`}
          >
            {/* Course Details */}
            {selectedCourse.sections.length > 0 && (
              <div className="mb-4">
                <p><strong>Instructor:</strong> {selectedCourse.sections[0].instructor}</p>
                <p>
                  <strong>Instructional Method:</strong>{' '}
                  {selectedCourse.sections[0].instructional_method}
                </p>
                <p><strong>Units:</strong> {selectedCourse.sections[0].units}</p>
                <p><strong>CRN:</strong> {selectedCourse.sections[0].crn}</p>
                {selectedCourse.sections[0].additional_information && (
                  <p>
                    <strong>Additional Information:</strong>{' '}
                    {selectedCourse.sections[0].additional_information}
                  </p>
                )}
              </div>
            )}
          </div>
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
       {/* Timetable Actions */}
      <div className="mt-4">
        {/* Timetable Name Input */}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Timetable Name:</label>
          <input
            type="text"
            className="w-full bg-surface-300 border-surface-400 text-white placeholder-surface-500 rounded-md p-2"
            value={timetableNameInput}
            onChange={(e) => setTimetableNameInput(e.target.value)}
          />
        </div>

        {/* Save Timetable Button */}
        <button
          className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded"
          onClick={() => handleSaveTimetable(timetableNameInput)}
        >
          Save Timetable
        </button>

        {/* Timetables Dropdown */}
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Saved Timetables:</label>
          <select
            className="w-full bg-surface-300 border-surface-400 text-white placeholder-surface-500 rounded-md p-2"
            value={currentTimetableName}
            onChange={(e) => loadTimetable(e.target.value)}
          >
            {timetables.map((tt) => (
              <option key={tt.name} value={tt.name}>
                {tt.name}
              </option>
            ))}
          </select>
        </div>

        {/* New Timetable Button */}
        <button
          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
          onClick={createNewTimetable}
        >
          New Timetable
        </button>

        {/* Delete Timetable Button */}
        <button
          className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
          onClick={() => deleteTimetable(currentTimetableName)}
        >
          Delete Timetable
        </button>

        {/* Export to ICS Button */}
        <button
          className="mt-2 w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded"
          onClick={handleExportICS}
        >
          Export to .ics
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;