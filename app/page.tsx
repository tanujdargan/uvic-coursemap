// page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/TopBar';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export default function Home() {
  const [videoSource, setVideoSource] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);

  useEffect(() => {
    const determineVideoSource = () => {
      if (window.innerWidth <= 768) {
        setVideoSource('./CourseMap-phone.mp4');
      } else {
        setVideoSource('./CourseMap.mp4');
      }
    };

    // Initial determination
    determineVideoSource();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      determineVideoSource();
    });

    // Observe the document body
    resizeObserver.observe(document.body);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoSource]);

  // Add this useEffect to handle isMobile state
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface-100 text-black dark:bg-surface-800 dark:text-white">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.1 } },
        }}
      >
        <div className="video-bg">
          {videoSource && (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="object-cover w-full h-full"
            >
              <source src={videoSource} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
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
          paddingTop: isTopBarVisible ? '64px' : '0px',
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
            <h1 className="text-2xl font-bold mb-8 text-white">
              Explore Courses and Create Timetables for your semester at UVIC
            </h1>
          </motion.div>
          <div className="flex justify-center space-x-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { delay: 0.25 } },
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
                visible: { opacity: 1, transition: { delay: 0.3 } },
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
              visible: { opacity: 1, transition: { delay: 0.35 } },
            }}
            className="mt-8 text-white"
          >
            Built by{' '}
            <a
              href="https://github.com/TanujDargan"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
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