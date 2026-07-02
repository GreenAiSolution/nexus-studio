'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollSectionProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}

export function ScrollSection({
  children,
  direction = 'up',
  delay = 0,
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const getInitialTransform = () => {
      switch (direction) {
        case 'left':
          return { x: -100, opacity: 0 };
        case 'right':
          return { x: 100, opacity: 0 };
        case 'down':
          return { y: -50, opacity: 0 };
        case 'up':
        default:
          return { y: 50, opacity: 0 };
      }
    };

    gsap.fromTo(
      ref.current,
      getInitialTransform(),
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: false,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [direction, delay]);

  return <div ref={ref}>{children}</div>;
}
