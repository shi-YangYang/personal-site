"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "./i18n-provider";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { activeSectionStore } from "@/lib/active-section";
import { terminalStore } from "@/lib/terminal-store";
import { agentStore } from "@/lib/agent-store";
import { Bot, Menu, X, ChevronDown, TerminalSquare } from "lucide-react";

const navItems = [
  { key: "nav.home", href: "" },
  { key: "nav.projects", href: "#projects" },
  { key: "nav.blog", href: "/blog" },
  { key: "nav.contact", href: "#contact" },
] as const;

const siteMap = [
  { path: "~/personal-site", key: "nav.home", href: "" },
  { path: "~/personal-site#about", key: "nav.about", href: "#about" },
  { path: "~/personal-site#experience", key: "nav.experience", href: "#experience" },
  { path: "~/personal-site#skills", key: "nav.skills", href: "#skills" },
  { path: "~/personal-site#projects", key: "nav.projects", href: "#projects" },
  { path: "~/personal-site#links", key: "nav.links", href: "#links" },
  { path: "~/personal-site/blog", key: "nav.blog", href: "/blog" },
  { path: "~/personal-site#contact", key: "nav.contact", href: "#contact" },
] as const;

export function Navbar() {
  const t = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const dirRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return activeSectionStore.subscribe(setActiveSection);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!dirOpen) return;
    const onDown = (e: MouseEvent) => {
      if (dirRef.current && !dirRef.current.contains(e.target as Node)) {
        setDirOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDirOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dirOpen]);

  const basePath = `/${pathname.split("/")[1] ?? "zh"}`;
  const isHome = pathname === basePath;
  const restPath = pathname.split("/").slice(2).filter(Boolean).join("/");
  let pwd = "~/personal-site";
  if (isHome) {
    if (activeSection && activeSection !== "home") {
      pwd = `~/personal-site#${activeSection}`;
    }
  } else if (restPath) {
    pwd = `~/personal-site/${restPath}`;
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "py-3" : "py-5",
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full border transition-all duration-300 px-4 sm:px-6",
            scrolled
              ? "glass h-12 border-brand-primary/20"
              : "h-14 border-transparent bg-transparent",
          )}
        >
          <div className="relative" ref={dirRef}>
            <button
              type="button"
              onClick={() => setDirOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={dirOpen}
              className="flex items-center gap-2 font-mono text-sm group"
            >
              <TerminalSquare size={16} className="text-brand-glow" />
              <span className="hidden text-text-primary transition-colors group-hover:text-text-brand sm:inline">
                {pwd}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-text-muted transition-transform duration-200",
                  dirOpen && "rotate-180",
                )}
              />
            </button>

            {dirOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-3 w-64 glass rounded-xl border-brand-primary/20 p-2 shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center justify-between px-3 pt-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  <span>{pwd} $ ls</span>
                  <span className="text-brand-glow">▸ {t("nav.home")}</span>
                </div>
                <div className="px-2 pb-1.5 border-b border-white/5 mb-1" />
                {siteMap.map((item) => {
                  const href = `${basePath}${item.href}`;
                  return (
                    <Link
                      key={item.path}
                      href={href}
                      role="menuitem"
                      onClick={() => setDirOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-brand-primary/10 transition-colors"
                    >
                      <span className="font-mono text-sm text-text-secondary group-hover:text-text-brand truncate">
                        {item.path}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted shrink-0 whitespace-nowrap">
                        {t(item.key)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <ul className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const href =
                item.href.startsWith("#")
                  ? `${basePath}${item.href}`
                  : `${basePath}${item.href}`;
              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-brand transition-colors"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => terminalStore.toggle()}
              className="p-2 text-text-secondary hover:text-text-brand transition-colors"
              aria-label="Toggle visitor terminal"
            >
              <TerminalSquare size={18} />
            </button>
            <button
              type="button"
              onClick={() => agentStore.open()}
              className="p-2 text-text-secondary hover:text-text-brand transition-colors"
              aria-label="Open site agent"
            >
              <Bot size={18} />
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2 text-text-secondary hover:text-text-brand"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl border-brand-primary/20 p-2">
            <ul className="flex flex-col">
              {navItems.map((item) => {
                const href =
                  item.href.startsWith("#")
                    ? `${basePath}${item.href}`
                    : `${basePath}${item.href}`;
                return (
                  <li key={item.key}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text-brand hover:bg-brand-primary/5 rounded-lg transition-colors"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
