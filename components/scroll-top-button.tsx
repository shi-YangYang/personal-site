"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setVisible(el.scrollTop > 400);
      setProgress(total > 0 ? el.scrollTop / total : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ring circumference for a 40px circle
  const r = 18;
  const c = 2 * Math.PI * r;

  return (
    <Button
      isIconOnly
      variant="ghost"
      onPress={goTop}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 size-11 rounded-full glass text-text-secondary hover:text-text-brand hover:glow",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4",
      )}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--fx-ring-track)"
          strokeWidth="2"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--fx-ring)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ArrowUp size={16} className="relative" />
    </Button>
  );
}
