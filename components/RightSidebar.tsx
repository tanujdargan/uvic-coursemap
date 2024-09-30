// components/RightSidebar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Section, Course } from '../utils/interfaces';
import { IProfessorRating } from '@/utils/rateMyProfessor'; // Adjust the path as necessary

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
  setCurrentTimetableName: (name: string) => void;
  loadTimetable: (name: string) => void;
  createNewTimetable: () => void;
  handleDeleteCourse: (courseToDelete: Course) => void;
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
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timetableNameInput, setTimetableNameInput] = useState(currentTimetableName);
  const [professorRating, setProfessorRating] = useState<IProfessorRating | null>(null);

  useEffect(() => {
    setTimetableNameInput(currentTimetableName);
  }, [currentTimetableName]);

  useEffect(() => {
    const fetchProfessorRating = async (instructorName: string) => {
      if (!instructorName || instructorName.trim() === '') {
        setProfessorRating(null);
        return;
      }

      try {
        const response = await fetch(`/api/ratings/${encodeURIComponent(instructorName)}`);
        if (response.ok) {
          const data: IProfessorRating = await response.json();
          setProfessorRating(data);
        } else {
          console.error(`Failed to fetch rating for ${instructorName}: ${response.statusText}`);
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
        console.error('Error fetching professor rating:', error);
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
    };

    if (selectedCourse && selectedCourse.sections.length > 0) {
      // Get the instructor name from the first section (adjust if necessary)
      const instructorName = selectedCourse.sections[0].instructor;
      fetchProfessorRating(instructorName);
    } else {
      setProfessorRating(null);
    }
  }, [selectedCourse]);

  return (
    <div className="bg-surface-100 h-full w-full p-4 overflow-y-auto border-l border-surface-300">
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
                <p>
                  <strong>Instructor:</strong> {selectedCourse.sections[0].instructor}
                </p>
                {professorRating && (
                  <>
                    <p>
                      <strong>Rate My Prof Rating:</strong>{' '}
                      {professorRating.avgRating !== -1 ? (
                        <>
                          {professorRating.avgRating} / 5.0
                          {' ('}
                          {professorRating.numRatings} ratings{') '}
                          <a
                            href={professorRating.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            View Profile
                          </a>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </p>
                    <p>
                      <strong>Level of Difficulty:</strong>{' '}
                      {professorRating.avgDifficulty !== -1 ? (
                        `${professorRating.avgDifficulty} / 5.0`
                      ) : (
                        'N/A'
                      )}
                    </p>
                    <p>
                      <strong>Would Take Again:</strong>{' '}
                      {professorRating.wouldTakeAgainPercent !== -1 ? (
                        `${professorRating.wouldTakeAgainPercent.toFixed(2)}%`
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </>
                )}
                <p>
                  <strong>Instructional Method:</strong>{' '}
                  {selectedCourse.sections[0].instructional_method}
                </p>
                <p>
                  <strong>Units:</strong> {selectedCourse.sections[0].units}
                </p>
                <p>
                  <strong>CRN:</strong> {selectedCourse.sections[0].crn}
                </p>
                {selectedCourse.sections[0].additional_information && (
                  <p>
                    <strong>Additional Information:</strong>{' '}
                    {selectedCourse.sections[0].additional_information}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sections Selection */}
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

          {/* Timetable Actions */}
          <div className="mt-4">
            {/* Timetable Name Input */}
            <div className="timetable-name-container" style={{ paddingBottom: '10px' }}>
              <label htmlFor="timetable-name">Timetable Name:</label>
              <div style={{ paddingBottom: '4px' }}></div>
              <input
                id="timetable-name"
                type="text"
                value={timetableNameInput}
                onChange={(e) => setTimetableNameInput(e.target.value)}
                className="timetable-name-input"
                style={{
                  backgroundColor: 'var(--surface-300)',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  margin: '0',
                  padding: '2px',
                  width: '100%',
                  borderRadius: '4px',
                }}
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
                className="w-full bg-surface-300 border-surface-400 text--surface-text placeholder-surface-500 rounded-md p-2"
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
              onClick={handleDeleteTimetable}
            >
              Delete Timetable
            </button>

            {/* Delete Course Button */}
            {selectedCourse && (
              <button
                className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
                onClick={() => handleDeleteCourse(selectedCourse)}
              >
                Delete Course
              </button>
            )}

            {/* Export to ICS Button */}
            <button
              className="mt-2 w-full bg-surface-300 hover:bg-surface-300 py-2 px-4 rounded"
              onClick={handleExportICS}
            >
              Export to .ics
            </button>
          </div>
        </>
      ) : (
        <p className="text-center">Select a course to view sections</p>
      )}
    </div>
  );
};

export default RightSidebar;