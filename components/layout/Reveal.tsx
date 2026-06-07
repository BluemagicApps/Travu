"use client";

import { useEffect, useRef, useState, type ElementType, type JSX, type Ref, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Fades + lifts its children into view on scroll. Visual-only; renders the
 * given element (`as`, default <div>) so it can stand in for a section/li.
 * Honours prefers-reduced-motion via the CSS safety net in globals.css.
 */
export function Reveal({
  children,
  as: tag = "div",
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delayMs?: number;
}) {
  const Tag = tag as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn("reveal-on-scroll", visible && "is-visible", className)}
    >
      {children}
    </Tag>
  );
}
