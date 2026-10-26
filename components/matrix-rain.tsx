"use client";

import { useEffect, useRef, useState } from "react";
import { fxStore } from "@/lib/fx-store";

const GLYPHS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => fxStore.subscribe(setActive), []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let last = 0;
    let width = 0;
    let height = 0;
    const fontSize = 15;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    };

    const draw = (time: number) => {
      if (time - last > 55) {
        last = time;
        // Clear instead of painting a translucent black rect: the latter
        // darkens the whole page and reads as an ugly mask.
        context.clearRect(0, 0, width, height);
        context.font = `${fontSize}px "Geist Mono", monospace`;
        for (let index = 0; index < columns; index += 1) {
          const head = drops[index];
          const x = index * fontSize;
          for (let trail = 0; trail < 7; trail += 1) {
            const y = (head - trail) * fontSize;
            if (y < -fontSize || y > height + fontSize) continue;
            const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            const alpha = (1 - trail / 7) * 0.55;
            context.fillStyle =
              trail === 0
                ? "rgba(52, 211, 153, 0.85)"
                : `rgba(16, 185, 129, ${alpha})`;
            context.fillText(glyph, x, y);
          }
          if (head * fontSize > height && Math.random() > 0.985) drops[index] = 0;
          drops[index] += 1;
        }
      }
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[1] transition-opacity duration-500 ${
        active ? "opacity-50" : "opacity-0"
      }`}
    />
  );
}
