'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  isMobile: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTopBarVisible: boolean; // Add this prop
}

const TopBar: React.FC<TopBarProps> = ({ isMobile, isMenuOpen, setIsMenuOpen, isTopBarVisible }) => {
  const variants = {
    hidden: { y: '-100%', opacity: 0, transition: { duration: 0.3 } },
    visible: { y: '0%', opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 text-white flex items-center justify-between bg-surface-100"
      initial="visible"
      animate={isTopBarVisible ? 'visible' : 'hidden'}
      variants={variants}
      style={{ height: '64px' }}
    >
      <Link href="/" className="text-xl font-bold">
        CourseMap
      </Link>
      <div className="md:hidden">
        <Button variant="ghost" size="icon" onClick={() => { setIsMenuOpen(!isMenuOpen); }}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <div className="hidden md:flex space-x-4">
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
            <Github className="h-5 w-5" />
          </a>
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-surface-300"></div>
      {/* Mobile Menu */}
      {isMobile && (
        <div
        className={`absolute top-full left-0 w-full bg-surface-100 text-white flex flex-col items-center space-y-2 py-4 transition-transform duration-300 ease-in-out ${
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
    </motion.div>
  );
};

export default TopBar;