"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../providers/theme-provider";
import type { Locale } from "@/lib/i18n";

const GISCUS = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
};

export function Giscus({ term, locale }: { term: string; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const configured = Boolean(
    GISCUS.repo && GISCUS.repoId && GISCUS.category && GISCUS.categoryId,
  );

  useEffect(() => {
    if (!configured || !ref.current) return;

    const container = ref.current;
    container.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS.repo as string);
    script.setAttribute("data-repo-id", GISCUS.repoId as string);
    script.setAttribute("data-category", GISCUS.category as string);
    script.setAttribute("data-category-id", GISCUS.categoryId as string);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", theme === "light" ? "light" : "dark_dimmed");
    script.setAttribute("data-lang", locale === "zh" ? "zh-CN" : "en");
    script.setAttribute("data-loading", "lazy");
    container.appendChild(script);
  }, [configured, theme, locale, term]);

  if (!configured) return null;

  return <div ref={ref} />;
}
