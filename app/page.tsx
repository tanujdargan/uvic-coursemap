"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TopBar from '../components/TopBar';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [isTabActive, setIsTabActive] = useState(true);
  const [videoSource, setVideoSource] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Function to determine the video source based on screen size
    const determineVideoSource = () => {
      // Example check: use window width to differentiate between mobile and desktop
      if (window.innerWidth <= 768) {
        setVideoSource('./CourseMap-phone.mp4');
      } else {
        setVideoSource('./CourseMap.mp4');
      }
    };

    // Initial determination
    determineVideoSource();

    // Attempt to play the video
    const playVideo = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      }
    };

    // Play video when source is set and component mounts
    if (videoSource) {
      playVideo();
    }

    // Update video source on window resize
    window.addEventListener('resize', determineVideoSource);

    // Handle tab visibility change
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

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', determineVideoSource);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [videoSource]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      <motion.div initial="hidden" animate="visible" variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay: 0.1 } }
      }}>
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
      <TopBar />
      </motion.div>
      <div className="flex-grow flex items-center justify-center">
        <div className="z-10 text-center mt-32">
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
