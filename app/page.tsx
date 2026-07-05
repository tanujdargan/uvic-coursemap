// page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TopBar from '@/components/TopBar';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, type Variants } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Search,
  CalendarRange,
  Armchair,
  Star,
  ArrowRight,
  Github,
  Sparkles,
} from 'lucide-react';
import './page.css';

const features = [
  {
    icon: Search,
    title: 'Explore the catalog',
    description:
      'Search every UVic course by subject, keyword, or CRN. Sections grouped by course with instructors, times, and locations.',
  },
  {
    icon: CalendarRange,
    title: 'Build timetables',
    description:
      'Drag sections onto a weekly calendar, catch conflicts instantly, and export your finished schedule to your calendar app.',
  },
  {
    icon: Armchair,
    title: 'Live seat availability',
    description:
      'Real-time enrolment and waitlist numbers pulled straight from Banner — see what is open before you register.',
  },
  {
    icon: Star,
    title: 'Professor ratings',
    description:
      'RateMyProfessor scores surfaced next to each instructor so you can pick the section that fits you best.',
  },
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="landing-root bg-background text-foreground">
      {/* Quiet backdrop: dot grid + one soft accent glow */}
      <div className="dot-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <TopBar
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTopBarVisible={true}
      />

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-36 text-center sm:pt-44">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={item}>
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium backdrop-blur"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Live seat data is back
              </Badge>
            </motion.div>

            <motion.h1
              variants={item}
              className="max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            >
              Plan your <span className="accent-text">UVic timetable</span>
              <br className="hidden sm:block" /> in minutes, not tabs.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Explore the full course catalog, build a conflict-free schedule,
              and check live seat availability and professor ratings — all in
              one place.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group h-11 rounded-full px-7 text-base shadow-lg shadow-primary/20"
              >
                <Link href="/explore">
                  Explore Courses
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-background/50 px-7 text-base backdrop-blur"
              >
                <Link href="/scheduler">Build a Timetable</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="preview-frame"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/preview-explore.jpg"
              alt="UVic CourseMap course explorer showing live section seat availability"
              className="block w-full"
              width={1440}
              height={900}
            />
          </motion.div>

          {/* Stats strip */}
          <motion.dl
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 text-center sm:grid-cols-3"
          >
            {[
              ['3,600+', 'sections every term'],
              ['110', 'subjects covered'],
              ['Live', 'seat & waitlist data'],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="text-3xl font-bold tracking-tight">{stat}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-14 text-center"
          >
            <div
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-2/3 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Registration season, sorted.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Find your courses, lock in your times, and beat the waitlist —
                start planning in seconds.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-base shadow-lg shadow-primary/20"
                >
                  <Link href="/explore">Get started</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-11 rounded-full px-6 text-base"
                >
                  <a
                    href="https://github.com/TanujDargan/uvic-coursemap"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Star on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/60 px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              Built by{' '}
              <a
                href="https://github.com/TanujDargan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                @TanujDargan
              </a>
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              UVic CourseMap is an independent student project and is not
              affiliated with, endorsed by, or connected to the University of
              Victoria. Always verify details on the official UVic registration
              system.
            </p>
          </div>
        </footer>
      </main>

      <SpeedInsights />
      <Analytics />
    </div>
  );
}
