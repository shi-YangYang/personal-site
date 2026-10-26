"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { activeSectionStore } from "@/lib/active-section";

type Item = { id: string; label: string };

export function SectionIndicator({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(item.id);
            activeSectionStore.set(item.id);
          }
        },
        { threshold: 0.5 },
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.id === "home" ? `/${locale}` : `/${locale}/${item.id}`}
          scroll={false}
          className="group relative flex items-center justify-end"
          aria-label={`Go to ${item.label}`}
        >
          <span className="absolute right-5 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-text-brand bg-bg-elevated/80 px-2 py-1 rounded border border-brand-primary/20 pointer-events-none whitespace-nowrap">
            {item.label}
          </span>
          <span
            className={
              active === item.id
                ? "size-2.5 rounded-full bg-brand-glow glow"
                : "size-1.5 rounded-full bg-text-muted group-hover:bg-text-brand transition-all"
            }
          />
        </Link>
      ))}
    </nav>
  );
}
