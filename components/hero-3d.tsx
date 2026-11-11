"use client";

import { Code3D } from "./code-3d";

export function Hero3D() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <div className="absolute inset-x-[-20%] bottom-0 h-[52%] perspective-grid opacity-70" />

      <Code3D
        className="left-[3%] top-[14%] opacity-20 text-3xl md:text-5xl hidden md:block"
        code="while (alive) { code(); }"
      />
    </div>
  );
}
