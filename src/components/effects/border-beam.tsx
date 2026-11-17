"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BorderBeam({
  children,
  className,
  beamColor = "from-transparent via-brand-glow to-transparent",
  duration = 4,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  beamColor?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}

      {/* 顶部流光 */}
      <motion.div
        aria-hidden
        className={cn(
          "absolute left-0 right-0 top-0 h-px overflow-hidden",
        )}
      >
        <motion.div
          className={cn("h-full w-1/2 bg-gradient-to-r", beamColor)}
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* 底部流光(反方向) */}
      <motion.div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px overflow-hidden"
      >
        <motion.div
          className={cn("h-full w-1/2 bg-gradient-to-r", beamColor)}
          initial={{ x: "300%" }}
          animate={{ x: "-100%" }}
          transition={{
            duration,
            delay: delay + duration / 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  );
}
