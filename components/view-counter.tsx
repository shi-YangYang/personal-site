"use client";

import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export function ViewCounter({
  slug,
  initial,
}: {
  slug: string;
  initial: number;
}) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const key = `viewed:${slug}`;
    let shouldCount = true;
    try {
      if (sessionStorage.getItem(key)) {
        shouldCount = false;
      } else {
        sessionStorage.setItem(key, "1");
      }
    } catch {
      // ignore storage errors
    }
    if (shouldCount) {
      fetch(apiUrl(`/api/views/${slug}`), { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && typeof data.views === "number") {
            setViews(data.views);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1.5 text-text-muted">
      <Eye size={14} />
      <span>{views}</span>
    </span>
  );
}
