"use client";

import { useEffect } from "react";

export function SectionScroll({ section }: { section?: string }) {
  useEffect(() => {
    // Drop any legacy hash from old links/bookmarks.
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  useEffect(() => {
    if (!section) return;
    const target = document.getElementById(section);
    if (!target) return;

    const scroll = () => {
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };

    const frame = requestAnimationFrame(() => {
      scroll();
      window.setTimeout(scroll, 80);
    });
    return () => cancelAnimationFrame(frame);
  }, [section]);

  return null;
}
