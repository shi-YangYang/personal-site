"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { Heading } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

export function TableOfContents({
  items,
  label,
}: {
  items: Heading[];
  label: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={label}
      className="glass rounded-xl border-brand-primary/20 p-5 mb-10"
    >
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-brand mb-4">
        <List size={14} />
        {label}
      </div>
      <ol className="space-y-2">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 16}px` }}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block text-sm leading-relaxed transition-colors border-l-2 pl-3",
                active === item.id
                  ? "text-text-brand border-brand-primary"
                  : "text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
