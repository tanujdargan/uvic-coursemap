'use client'

import { useState, useEffect } from 'react';
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
import TopBar from '@/components/TopBar';
import { Progress } from '@/components/ui/progress'; // Import the Progress component

export default function ExplorePage() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true); // Start loading
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data);

      // Extract unique subjects and sort them alphabetically
      const uniqueSubjects = Array.from(new Set(data.map((course) => course.subject)));
      uniqueSubjects.sort();

      setSubjects(
        uniqueSubjects.map((subject) => ({
          id: subject,
          name: subject,
        }))
      );
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  // Update the search filtering logic
  const searchWords = searchTerm.toLowerCase().split(' ').filter(Boolean);

  const filteredCourses = courses.filter((course) => {
    const courseString = `${course.subject} ${course.course_number} ${course.course_name}`.toLowerCase();
    return searchWords.every((word) => courseString.includes(word));
  });

  const subjectIdsWithMatchingCourses = new Set(filteredCourses.map((course) => course.subject));

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectIdsWithMatchingCourses.has(subject.id)
  );

  if (loading) {
    // Render the loading indicator using Progress component
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="w-2/3">
          <p className="mb-4 text-center text-xl">Loading courses...</p>
          <Progress value={null} className="w-full bg-gray-800" /> {/* Indeterminate progress */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search courses or subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="single" collapsible className="w-full">
              {filteredSubjects.map((subject) => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-gray-300 hover:text-white">
                    {subject.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    {courses
                      .filter((course) => course.subject === subject.id)
                      .sort((a, b) => a.course_number - b.course_number)
                      .map((course) => (
                        <Button
                          key={course._id.$oid || course._id}
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-gray-300 hover:text-white"
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
        <div className="w-2/3 p-4">
          {selectedCourse ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {selectedCourse.subject} {selectedCourse.course_number}: {selectedCourse.course_name}
              </h2>
              <p className="mb-4">{selectedCourse.description || 'No description available.'}</p>

              <h3 className="text-xl font-semibold mb-2">Available Sections</h3>
              <p>{selectedCourse.section}</p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Course Details</h3>
              <ul className="list-disc ml-6">
                <li>
                  <strong>Term:</strong> {selectedCourse.term}
                </li>
                <li>
                  <strong>Frequency:</strong> {selectedCourse.frequency}
                </li>
                <li>
                  <strong>Time:</strong> {selectedCourse.time}
                </li>
                <li>
                  <strong>Days:</strong> {selectedCourse.days}
                </li>
                <li>
                  <strong>Location:</strong> {selectedCourse.location}
                </li>
                <li>
                  <strong>Date Range:</strong> {selectedCourse.date_range}
                </li>
                <li>
                  <strong>Schedule Type:</strong> {selectedCourse.schedule_type}
                </li>
                <li>
                  <strong>Instructor:</strong> {selectedCourse.instructor}
                </li>
                <li>
                  <strong>Instructional Method:</strong> {selectedCourse.instructional_method}
                </li>
                <li>
                  <strong>Units:</strong> {selectedCourse.units}
                </li>
                <li>
                  <strong>CRN:</strong> {selectedCourse.crn}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Prerequisites</h3>
              <p>{selectedCourse.prerequisites || 'None'}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xl">Select a course to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}