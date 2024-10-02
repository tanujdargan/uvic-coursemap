// TopBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as Switch from '@radix-ui/react-switch';

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-surface-100 text-black dark:bg-surface-800 dark:text-white border-b border-surface-300`}
      style={{
        height: '64px',
        transform: isTopBarVisible ? 'translateY(0%)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      {/* Left Side - Logo */}
      <Link href="/" className="text-xl font-bold ml-4">
        CourseMap
      </Link>

      {/* Right Side - Theme Toggle and Navigation/Menu */}
      <div className="flex items-center mr-4">
        {/* Theme Toggle */}
        {mounted && (
          <div className="flex items-center mr-2">
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              <Switch.Root
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-300 dark:bg-gray-700 transition-colors duration-200 focus:outline-none"
              >
                <Switch.Thumb
                  className="inline-block w-4 h-4 transform bg-white rounded-full shadow-lg transition-transform duration-200 ease-in-out translate-x-1 dark:translate-x-6"
                />
              </Switch.Root>
              <Moon className="h-5 w-5 text-gray-700 dark:text-yellow-500" />
            </div>
          </div>
        )}

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center">
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

        {/* Mobile Menu Button */}
        <div className="md:hidden">
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
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <div
          className={`absolute top-full left-0 w-full bg-surface-100 text-black dark:bg-surface-800 dark:text-white flex flex-col items-center space-y-2 overflow-hidden transition-transform duration-300 ease-in-out ${
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
          <Button
            asChild
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
          >
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