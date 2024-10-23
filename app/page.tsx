// page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/TopBar';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import './page.css'; // Import the CSS file for custom styles

// Define gradients outside the component to prevent re-definition on every render
const gradients = [
  ['var(--gradient-1-1)', 'var(--gradient-1-2)', 'var(--gradient-1-3)'],
  ['var(--gradient-2-1)', 'var(--gradient-2-2)', 'var(--gradient-2-3)'],
];

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);

  // Reference to the wrapper div for setting CSS variables
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [gradientIndex, setGradientIndex] = useState<number>(0);

  // Update gradient index every 15 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setGradientIndex((prevIndex) => (prevIndex + 1) % gradients.length);
    }, 15000); // Update every 15 seconds

    return () => clearInterval(intervalId);
  }, []); // Removed gradients.length from dependencies

  // Update CSS variables when gradient index changes
  useEffect(() => {
    if (!wrapperRef.current) return;

    const [a, b, c] = gradients[gradientIndex];

    wrapperRef.current.style.setProperty('--color-a', a);
    wrapperRef.current.style.setProperty('--color-b', b);
    wrapperRef.current.style.setProperty('--color-c', c);
  }, [gradientIndex]); // Removed gradients from dependencies

  // Handle mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    // Event listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mouse interaction effect with throttling
  useEffect(() => {
    if (!wrapperRef.current) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel the previous animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPercent = (clientX / innerWidth) * 2 - 1; // -1 to 1
        const yPercent = (clientY / innerHeight) * 2 - 1; // -1 to 1

        wrapperRef.current!.style.setProperty('--mouse-x', xPercent.toString());
        wrapperRef.current!.style.setProperty('--mouse-y', yPercent.toString());
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="min-h-screen flex flex-col relative overflow-hidden text-black dark:text-white transition-colors"
      style={{
        background:
          'linear-gradient(to bottom right, var(--color-a), var(--color-b), var(--color-c))',
      }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blob before:animate-blob after:animate-blob-reverse"></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.1 } },
        }}
      >
        <TopBar
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isTopBarVisible={isTopBarVisible}
        />
      </motion.div>
      <div
        className="flex-grow flex items-center justify-center"
        style={{
          paddingTop: isTopBarVisible ? '0px' : '0px',
          transition: 'padding-top 0.3s ease-in-out',
        }}
      >
        <div className="z-10 text-center mt-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: -50 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h1
              className="z-100 text-6xl font-extrabold mb-4"
              style={{ color: 'var(--surface-text)' }}
            >
              CourseMap
            </h1>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: -50 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h1
              className="text-2xl font-bold mb-8"
              style={{ color: 'var(--surface-text)' }}
            >
              Explore Courses and Create Timetables for your semester at UVIC
            </h1>
          </motion.div>
          <div className="flex justify-center space-x-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { delay: 0.25 },
                },
              }}
            >
              <Button
                asChild
                variant="secondary"
                className="bg-surface-100 text-black dark:bg-surface-800 dark:text-white rounded-lg hover:bg-surface-300 dark:hover:bg-surface-700"
              >
                <Link href="/explore">Explore Courses</Link>
              </Button>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { delay: 0.3 },
                },
              }}
            >
              <Button
                asChild
                variant="secondary"
                className="bg-surface-100 text-black dark:bg-surface-800 dark:text-white rounded-lg hover:bg-surface-300 dark:hover:bg-surface-700"
              >
                <Link href="/scheduler">Create Timetable</Link>
              </Button>
            </motion.div>
          </div>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { delay: 0.35 },
              },
            }}
            className="mt-8"
            style={{ color: 'var(--surface-text)' }}
          >
            Built by{' '}
            <a
              href="https://github.com/TanujDargan"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--surface-text)' }}
            >
              @TanujDargan
            </a>
          </motion.p>
        </div>
      </div>
      <SpeedInsights />
      <Analytics />
    </div>
  );
}