"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const RADIUS = 23;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const y = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, y / total)) : 0;

      setVisible(y > 400);
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(
          CIRCUMFERENCE * (1 - progress),
        );
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 size-12",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4",
      )}
    >
      <svg
        className="pointer-events-none absolute inset-0 size-full -rotate-90"
        viewBox="0 0 48 48"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="var(--fx-ring-track)"
          strokeWidth="2"
        />
        <circle
          ref={ringRef}
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="var(--fx-ring)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
      <Button
        isIconOnly
        variant="ghost"
        onPress={goTop}
        aria-label="Back to top"
        className="glass absolute inset-0 size-12 min-h-0 rounded-full text-text-secondary hover:text-text-brand hover:glow"
      >
        <ArrowUp size={16} />
      </Button>
    </div>
  );
}
