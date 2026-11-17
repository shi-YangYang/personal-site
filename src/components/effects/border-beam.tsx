"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

export function BorderBeam({
  children,
  className,
  duration = 4,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      className={cn("border-beam relative overflow-hidden", className)}
      style={
        {
          "--beam-duration": `${duration}s`,
          "--beam-delay": `${delay}s`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
