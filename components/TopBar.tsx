// TopBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, Menu, X } from 'lucide-react';

interface TopBarProps {
  isMobile: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTopBarVisible: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  isMobile,
  isMenuOpen,
  setIsMenuOpen,
  isTopBarVisible,
}) => {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-white flex items-center justify-between bg-surface-100"
      style={{
        height: '64px',
        transform: isTopBarVisible ? 'translateY(0%)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <Link href="/" className="text-xl font-bold ml-4">
        CourseMap
      </Link>
      <div className="md:hidden mr-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <div className="hidden md:flex pr-4">
        <Button asChild variant="ghost" className="text-lg font-bold">
          <Link href="/explore">Explore Courses</Link>
        </Button>
        <Button asChild variant="ghost" className="text-lg font-bold">
          <Link href="/scheduler">Timetable</Link>
        </Button>
        <Button asChild variant="ghost" size="icon">
          <a
            href="https://github.com/TanujDargan/uvic-coursemap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-5 w-5 mr-2" />
          </a>
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-surface-300"></div>
      {/* Mobile Menu */}
      {isMobile && (
        <div
          className={`absolute top-full left-0 w-full bg-surface-100 text-white flex flex-col items-center space-y-2 overflow-hidden transition-transform duration-300 ease-in-out ${
            isMenuOpen
              ? 'transform translate-y-0 opacity-100 pointer-events-auto'
              : 'transform -translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <Button
            asChild
            variant="ghost"
            className="text-lg font-bold w-full text-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href="/explore">Explore Courses</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-lg font-bold w-full text-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href="/scheduler">Timetable</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
            <a
              href="https://github.com/TanujDargan/uvic-coursemap"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};
export default TopBar;