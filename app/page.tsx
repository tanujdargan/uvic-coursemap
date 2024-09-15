"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TopBar from '../components/TopBar';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

export default function Home() {
  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "Stop Slacking!";
        setIsTabActive(false);
      } else {
        document.title = "Explore Courses";
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      <motion.div initial="hidden" animate="visible" variants={{
        hidden: {opacity: 0 },
        visible: {opacity: 1, transition: { delay: 0.1 } }
      }}>
      <div className="black-tint"></div>
      <div className="absolute inset-0 z-0">
        <div className="gradient-bg">
          <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
          <div className="gradients-container">
            <div className="g1"></div>
            <div className="g2"></div>
            <div className="g3"></div>
            <div className="g4"></div>
            <div className="g5"></div>
            <div className="interactive"></div>
          </div>
        </div>
      </div>
  
        <TopBar />
      </motion.div>
      <div className="flex-grow flex items-center justify-center">
        <div className="z-10 text-center">
        <motion.div initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0},
            visible: { opacity: 1}
          }}>
            <h1 className="text-8xl font-bold text-white mb-8">
              CourseMap
            </h1>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0, y: -50 },
            visible: { opacity: 1, y: 0 }
          }}>
            <h1 className="text-2xl font-bold text-white mb-8">
              Explore courses and create timetables for your semester at UVIC
            </h1>
          </motion.div>
          <div className="flex justify-center space-x-4">
            <motion.div initial="hidden" animate="visible" variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { delay: 0.25 } }
            }}>
              <Button asChild variant="secondary">
                <Link href="/explore">Explore Courses</Link>
              </Button>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { delay: 0.30 } }
            }}>
              <Button asChild variant="secondary">
                <Link href="/scheduler">Create Timetable</Link>
              </Button>
            </motion.div>
          </div>
          <motion.p initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: 0.35 } }
          }} className="mt-8 text-white">
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