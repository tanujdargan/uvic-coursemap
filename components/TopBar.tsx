// TopBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Github, Menu, X, Sun, Moon, GraduationCap } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TopBarProps {
  isMobile: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTopBarVisible: boolean;
}

const navLinks = [
  { href: '/explore', label: 'Explore Courses' },
  { href: '/scheduler', label: 'Timetable' },
];

const TopBar: React.FC<TopBarProps> = ({
  isMobile,
  isMenuOpen,
  setIsMenuOpen,
  isTopBarVisible,
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border/60 bg-background/70 text-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      style={{
        transform: isTopBarVisible ? 'translateY(0%)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left — Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>CourseMap</span>
        </Link>

        {/* Right — Nav + theme toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <div className="mr-1 flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) =>
                  setTheme(checked ? 'dark' : 'light')
                }
                aria-label="Toggle dark mode"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'font-medium',
                    active && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              );
            })}
            <Button asChild variant="ghost" size="icon" aria-label="GitHub">
              <a
                href="https://github.com/TanujDargan/uvic-coursemap"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <div
          className={cn(
            'absolute left-0 top-full w-full overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-in-out',
            isMenuOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-4 opacity-0'
          )}
        >
          <div className="flex flex-col p-2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className="w-full justify-start font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <a
                href="https://github.com/TanujDargan/uvic-coursemap"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
