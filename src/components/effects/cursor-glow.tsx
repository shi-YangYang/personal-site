"use client";

import { useEffect, useState } from "react";

export function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setPos({ x: clientX, y: clientY });
        setVisible(true);
      });
    };
    const onLeave = () => setVisible(false);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="absolute size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl fx-cursor-glow"
        style={{
          left: pos.x,
          top: pos.y,
        }}
      />
    </div>
  );
}
