'use client';

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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function ExplorePage() {
  const [courses, setCourses] = useState([]);
  const [groupedCourses, setGroupedCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
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

      // Extract unique terms
      const uniqueTerms = Array.from(new Set(data.map((course) => course.term)));
      uniqueTerms.sort();
      setTerms(uniqueTerms);
      setSelectedTerm(uniqueTerms[0] || '');

      // Group courses
      const grouped = groupCoursesBySubjectAndNumber(data);
      setGroupedCourses(grouped);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 100 ? 0 : prev + 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  // Search and filter logic
  const searchWords = searchTerm.toLowerCase().split(' ').filter(Boolean);

  const filteredCourses = groupedCourses.filter((course) => {
    const courseString = `${course.subject} ${course.course_number} ${course.course_name}`.toLowerCase();
    const matchesSearch = searchWords.every((word) => courseString.includes(word));
    const matchesTerm = selectedTerm ? course.sections.some(section => section.term === parseInt(selectedTerm)) : true;
    return matchesSearch && matchesTerm;
  });

  const subjectIdsWithMatchingCourses = new Set(filteredCourses.map((course) => course.subject));

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subjectIdsWithMatchingCourses.has(subject.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="w-2/3">
          <p className="mb-4 text-center text-xl">Loading courses...</p>
          <Progress value={progressValue} className="w-full bg-gray-800" />
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
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search courses or subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={selectedTerm} onValueChange={(value) => setSelectedTerm(value)}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term} value={term.toString()}>
                    {convertTermToString(term)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="single" collapsible className="w-full">
              {filteredSubjects.map((subject) => (
                <AccordionItem key={subject.id} value={subject.id}>
                  <AccordionTrigger className="px-4 text-gray-300 hover:text-white">
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
              {selectedCourse.sections
                .filter(section => selectedTerm ? section.term === parseInt(selectedTerm) : true)
                .map((section, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="text-lg font-semibold">Section: {section.section}</h4>
                    <ul className="list-disc ml-6">
                      <li><strong>Term:</strong> {convertTermToString(section.term)}</li>
                      <li><strong>Frequency:</strong> {section.frequency}</li>
                      <li><strong>Time:</strong> {section.time}</li>
                      <li><strong>Days:</strong> {section.days}</li>
                      <li><strong>Location:</strong> {section.location}</li>
                      <li><strong>Date Range:</strong> {section.date_range}</li>
                      <li><strong>Schedule Type:</strong> {section.schedule_type}</li>
                      <li><strong>Instructor:</strong> {section.instructor}</li>
                      <li><strong>Instructional Method:</strong> {section.instructional_method}</li>
                      <li><strong>Units:</strong> {section.units}</li>
                      <li><strong>CRN:</strong> {section.crn}</li>
                    </ul>
                  </div>
              ))}
              {/* ... Prerequisites and other information */}
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

// Helper function to group courses
function groupCoursesBySubjectAndNumber(courses) {
  const grouped = {};
  courses.forEach((course) => {
    const key = `${course.subject}-${course.course_number}`;
    if (!grouped[key]) {
      grouped[key] = {
        subject: course.subject,
        course_number: course.course_number,
        course_name: course.course_name,
        sections: [course],
      };
    } else {
      if (!grouped[key].course_name.includes(course.course_name)) {
        grouped[key].course_name += ` / ${course.course_name}`;
      }
      grouped[key].sections.push(course);
    }
  });

  return Object.values(grouped);
}

// Helper function to convert term codes to strings
function convertTermToString(termCode) {
  const termStr = termCode.toString();
  const year = termStr.substring(0, 4);
  const semesterCode = termStr.substring(4);
  let semester = '';

  switch (semesterCode) {
    case '01':
      semester = 'Spring';
      break;
    case '05':
      semester = 'Summer';
      break;
    case '09':
      semester = 'Fall';
      break;
    default:
      semester = 'Unknown';
  }

  return `${semester} ${year}`;
}