"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/lib/i18n";
import type { PersonalData } from "@/content/data";
import { cn } from "@/lib/utils";
import { terminalStore } from "@/lib/terminal-store";
import { activeSectionStore } from "@/lib/active-section";
import { useI18n } from "./i18n-provider";
import { useTheme } from "./theme-provider";
import { bootLines } from "./boot-loader";

type PostLite = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  readingTime: string;
};

type TermLine = {
  kind: "user" | "out" | "ok" | "warn" | "dim" | "brand";
  text: string;
};

type BootLevel = (typeof bootLines)["zh"][number]["level"];

const sections = ["home", "about", "experience", "skills", "projects", "links", "contact"];

const socialKeys = ["github", "csdn", "qq", "x"];

const commandNames = [
  "help", "ls", "cat", "open", "cd", "views", "theme", "lang",
  "whoami", "pwd", "date", "echo", "sudo", "ping", "motd", "history", "clear", "exit",
];

const lineClass: Record<TermLine["kind"], string> = {
  user: "text-text-primary",
  out: "text-text-secondary",
  ok: "text-brand-glow",
  warn: "text-yellow-400",
  dim: "text-text-muted",
  brand: "text-text-brand",
};

const bootToTerm: Record<BootLevel, TermLine["kind"]> = {
  ok: "ok",
  warn: "warn",
  dim: "dim",
  cmd: "brand",
};

const copy = {
  zh: {
    title: "访客终端",
    prompt: "guest@personal-site:~$",
    placeholder: "输入 help,看看这台机器会什么…",
    hint: "esc 关闭 · ↑↓ 历史 · tab 补全",
    helpTitle: "可用命令(彩蛋不止一个):",
    helpLines: [
      "ls [blog|projects|socials]   看看这里都有什么",
      "open <目标>                  跳转:文章/项目/区块/外链",
      "cat about|contact|resume     翻档案",
      "views [slug]                 查阅读量(真实数据)",
      "theme [dark|light]           换主题",
      "lang [zh|en]                 换语言",
      "whoami / pwd / date / echo   老朋友",
      "sudo hire-me                 突击联系入口",
      "motd / history / clear / exit",
    ],
    motdPrefix: "personal-os v1.0 — 欢迎登入",
    motdFooter: "输入 'help' 查看命令。彩蛋不止一个。",
    unknown: (c: string) => `command not found: ${c} — 试试 'help'`,
    lsTotal: (n: number) => `共 ${n} 项`,
    lsEmpty: "(空 — 主人还没写)",
    catUnknown: (f: string) => `cat: ${f}: No such file or directory`,
    openUnknown: (t: string) => `open: no such target: ${t} — 试试 'ls blog' 或 'ls projects'`,
    openMissing: "open: 缺少目标 — 试试 'ls' 或 'help'",
    viewsNone: "views: 还没有文章可统计",
    viewsFail: "views: 统计接口没响应,稍后再试",
    viewsLine: (slug: string, n: number) => `${slug}.mdx · ${n} 次阅读`,
    themeNow: (t: string) => `当前主题: ${t}`,
    themeTo: (t: string) => `theme → ${t}`,
    themeBad: (t: string) => `theme: 未知的主题 '${t}' (dark | light)`,
    langNow: (l: string) => `当前语言: ${l}`,
    langBad: (l: string) => `lang: 未知语言 '${l}' (zh | en)`,
    sudoDenied: "sudo: 权限不足 — 这台机器只认主人的指纹",
    sudoHire: "收到,已为您转接『联系』区块 ↓",
    rmBlocked: "rm: 好险,被 /dev/null 拦下了。这台机器很惜命。",
    ping: "pong — 在线,一直都在(大部分时候)",
    vimEscape: "困在 vim 里了? ':q!' 是出口。",
    opening: (t: string) => `opening ${t} …`,
  },
  en: {
    title: "visitor terminal",
    prompt: "guest@personal-site:~$",
    placeholder: "type help to see what this machine can do…",
    hint: "esc close · ↑↓ history · tab complete",
    helpTitle: "Available commands (more easter eggs than shown):",
    helpLines: [
      "ls [blog|projects|socials]   see what's in here",
      "open <target>                jump to post/project/section/link",
      "cat about|contact|resume     read the dossier",
      "views [slug]                 view counters (real data)",
      "theme [dark|light]           switch theme",
      "lang [zh|en]                 switch language",
      "whoami / pwd / date / echo   the classics",
      "sudo hire-me                 fast-forward to contact",
      "motd / history / clear / exit",
    ],
    motdPrefix: "personal-os v1.0 — welcome",
    motdFooter: "Type 'help' for commands.",
    unknown: (c: string) => `command not found: ${c} — try 'help'`,
    lsTotal: (n: number) => `${n} item(s)`,
    lsEmpty: "(empty — nothing written yet)",
    catUnknown: (f: string) => `cat: ${f}: No such file or directory`,
    openUnknown: (t: string) => `open: no such target: ${t} — try 'ls blog' or 'ls projects'`,
    openMissing: "open: missing target — try 'ls' or 'help'",
    viewsNone: "views: no posts to count yet",
    viewsFail: "views: counter API is asleep, try again later",
    viewsLine: (slug: string, n: number) => `${slug}.mdx · ${n} views`,
    themeNow: (t: string) => `current theme: ${t}`,
    themeTo: (t: string) => `theme → ${t}`,
    themeBad: (t: string) => `theme: unknown theme '${t}' (dark | light)`,
    langNow: (l: string) => `current language: ${l}`,
    langBad: (l: string) => `lang: unknown locale '${l}' (zh | en)`,
    sudoDenied: "sudo: permission denied — this machine only trusts its owner's fingerprints",
    sudoHire: "On it, forwarding you to the contact section ↓",
    rmBlocked: "rm: intercepted by /dev/null. This machine values its life.",
    ping: "pong — online, always (mostly)",
    vimEscape: "Stuck in vim? ':q!' is the way out.",
    opening: (t: string) => `opening ${t} …`,
  },
} as const;

export function Terminal({
  locale: staticLocale,
  personal,
  posts,
}: {
  locale: Locale;
  personal: PersonalData;
  posts: PostLite[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();
  const { theme, set: setTheme } = useTheme();
  const c = copy[locale] ?? copy.zh;

  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<TermLine[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greetedRef = useRef(false);
  const draftRef = useRef("");

  useEffect(() => {
    return terminalStore.subscribe(setOpen);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        terminalStore.toggle();
        return;
      }
      if (e.key === "Escape" && terminalStore.get()) {
        terminalStore.set(false);
        return;
      }
      if ((e.key === "`" || e.key === "~") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null;
        if (el?.closest("[data-terminal]")) return;
        if (
          el &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        terminalStore.toggle();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!greetedRef.current) {
      greetedRef.current = true;
      const motd: TermLine[] = [
        { kind: "brand", text: copy[locale].motdPrefix },
        ...bootLines[locale].map((l) => ({
          kind: bootToTerm[l.level],
          text: l.text,
        })),
        { kind: "brand", text: copy[locale].motdFooter },
        { kind: "dim", text: "" },
      ];
      setLines((prev) => [...prev, ...motd]);
    }
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [open, locale]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const print = (out: TermLine[]) => setLines((prev) => [...prev, ...out]);

  const basePath = `/${pathname.split("/")[1] ?? staticLocale}`;

  const navigate = (target: string) => {
    if (!target) {
      print([{ kind: "warn", text: c.openMissing }]);
      return;
    }
    const post = posts.find((p) => p.slug === target);
    if (post) {
      print([{ kind: "ok", text: c.opening(`${target}.mdx`) }]);
      router.push(`${basePath}/blog/${post.slug}`);
      return;
    }
    const project = personal.projects.find((p) => p.slug === target);
    if (project) {
      print([{ kind: "ok", text: c.opening(`${target}/`) }]);
      router.push(`${basePath}/projects/${project.slug}`);
      return;
    }
    if (target === "blog") {
      print([{ kind: "ok", text: c.opening("blog/") }]);
      router.push(`${basePath}/blog`);
      return;
    }
    if ((socialKeys as string[]).includes(target)) {
      const url = personal.socials[target as keyof typeof personal.socials];
      if (url) {
        print([{ kind: "ok", text: c.opening(target) }]);
        window.open(url, "_blank", "noopener");
        return;
      }
    }
    if (sections.includes(target)) {
      print([{ kind: "ok", text: c.opening(target) }]);
      const active = activeSectionStore.get();
      const onHome = isHomePath(pathname, basePath) && (!active || active === "home" || active === target);
      if (onHome) {
        document
          .getElementById(target === "home" ? "home" : target)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(`${basePath}#${target}`);
      }
      return;
    }
    print([{ kind: "warn", text: c.openUnknown(target) }]);
  };

  const showViews = async (slug: string) => {
    const targets = slug ? posts.filter((p) => p.slug === slug) : posts;
    if (slug && targets.length === 0) {
      print([{ kind: "warn", text: c.openUnknown(slug) }]);
      return;
    }
    if (targets.length === 0) {
      print([{ kind: "warn", text: c.viewsNone }]);
      return;
    }
    try {
      const results = await Promise.all(
        targets.map(async (p) => {
          const res = await fetch(`/api/views/${encodeURIComponent(p.slug)}`);
          const data = await res.json();
          return {
            slug: p.slug,
            views: typeof data?.views === "number" ? data.views : 0,
          };
        }),
      );
      print([
        ...results.map((r) => ({ kind: "ok" as const, text: c.viewsLine(r.slug, r.views) })),
        { kind: "dim", text: "" },
      ]);
    } catch {
      print([{ kind: "warn", text: c.viewsFail }]);
    }
  };

  const run = (raw: string) => {
    const tokens = raw.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const arg = tokens.slice(1).join(" ");

    switch (cmd) {
      case "help":
        print([
          { kind: "brand", text: c.helpTitle },
          ...c.helpLines.map((t) => ({ kind: "out" as const, text: t })),
          { kind: "dim", text: "" },
        ]);
        break;

      case "clear":
        setLines([]);
        break;

      case "exit":
      case "logout":
        terminalStore.set(false);
        break;

      case "motd":
        print([
          { kind: "brand", text: c.motdPrefix },
          ...bootLines[locale].map((l) => ({ kind: bootToTerm[l.level], text: l.text })),
          { kind: "brand", text: c.motdFooter },
          { kind: "dim", text: "" },
        ]);
        break;

      case "ls": {
        if (!arg || arg === "-la" || arg === "-l" || arg === "-a") {
          print([
            ...sections.map((s) => ({
              kind: "out" as const,
              text: `drwxr-xr-x   ${s}${s === "home" ? "" : "/"}`,
            })),
            { kind: "out", text: "drwxr-xr-x   blog/" },
            { kind: "dim", text: "" },
          ]);
          break;
        }
        if (arg === "blog") {
          if (posts.length === 0) {
            print([{ kind: "dim", text: c.lsEmpty }]);
            break;
          }
          print([
            ...posts.map((p) => ({
              kind: "out" as const,
              text: `-rw-r--r--   ${p.date.slice(0, 10)}   ${p.slug}.mdx`,
            })),
            { kind: "dim", text: c.lsTotal(posts.length) },
          ]);
          break;
        }
        if (arg === "projects") {
          if (personal.projects.length === 0) {
            print([{ kind: "dim", text: c.lsEmpty }]);
            break;
          }
          print([
            ...personal.projects.map((p) => ({
              kind: "out" as const,
              text: `drwxr-xr-x   ${p.slug}/   ${p.year ?? ""}   ${p.title}`,
            })),
            { kind: "dim", text: c.lsTotal(personal.projects.length) },
          ]);
          break;
        }
        if (arg === "socials") {
          print([
            ...socialKeys.map((k) => ({
              kind: "out" as const,
              text: `lrwxrwxrwx   ${k} → ${personal.socials[k as keyof typeof personal.socials] ?? ""}`,
            })),
            { kind: "dim", text: "" },
          ]);
          break;
        }
        print([
          { kind: "warn", text: `ls: ${arg}: No such file or directory` },
          { kind: "dim", text: "ls: blog | projects | socials" },
        ]);
        break;
      }

      case "cat": {
        const file = arg || "about";
        if (file === "about") {
          print([
            { kind: "out", text: `${personal.role} @ ${personal.location}` },
            { kind: "out", text: personal.bio },
            { kind: "dim", text: "" },
          ]);
          break;
        }
        if (file === "contact") {
          print([
            { kind: "out", text: `email: ${personal.email}` },
            ...socialKeys.map((k) => ({
              kind: "out" as const,
              text: `${k}: ${personal.socials[k as keyof typeof personal.socials] ?? ""}`,
            })),
            { kind: "dim", text: "" },
          ]);
          break;
        }
        if (file === "resume" || file === "cv") {
          const out: TermLine[] = [];
          personal.experience.forEach((exp) => {
            out.push({ kind: "brand", text: `commit ${exp.period}` });
            out.push({ kind: "dim", text: `Author: ${personal.name} <${exp.company}>` });
            out.push({ kind: "out", text: `    ${exp.role} — ${exp.description}` });
            if (exp.tags?.length) {
              out.push({ kind: "dim", text: `    tags: ${exp.tags.join(", ")}` });
            }
            out.push({ kind: "dim", text: "" });
          });
          print(out);
          break;
        }
        print([{ kind: "warn", text: c.catUnknown(file) }]);
        break;
      }

      case "open":
      case "cd":
        navigate(arg);
        break;

      case "views":
        void showViews(arg);
        break;

      case "theme": {
        if (!arg) {
          print([{ kind: "out", text: c.themeNow(theme) }]);
          break;
        }
        if (arg === "dark" || arg === "light") {
          setTheme(arg);
          print([{ kind: "ok", text: c.themeTo(arg) }]);
        } else {
          print([{ kind: "warn", text: c.themeBad(arg) }]);
        }
        break;
      }

      case "lang": {
        if (!arg) {
          print([{ kind: "out", text: c.langNow(locale) }]);
          break;
        }
        if (arg === "zh" || arg === "en") {
          const rest = pathname.split("/").slice(2).join("/");
          router.push(`/${arg}${rest ? `/${rest}` : ""}`);
          print([{ kind: "ok", text: `lang → ${arg}` }]);
        } else {
          print([{ kind: "warn", text: c.langBad(arg) }]);
        }
        break;
      }

      case "whoami":
        print([{ kind: "out", text: `${personal.name} (${personal.role})` }]);
        break;

      case "pwd": {
        const active = activeSectionStore.get();
        let pwd = "~/portfolio";
        if (isHomePath(pathname, basePath)) {
          if (active && active !== "home") pwd = `~/portfolio#${active}`;
        } else {
          const rest = pathname.split("/").slice(2).filter(Boolean).join("/");
          pwd = `~/portfolio/${rest}`;
        }
        print([{ kind: "out", text: pwd }]);
        break;
      }

      case "date":
        print([
          {
            kind: "out",
            text: new Date().toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
          },
        ]);
        break;

      case "echo":
        print([{ kind: "out", text: arg }]);
        break;

      case "history":
        print(
          history.map((h, i) => ({ kind: "dim" as const, text: `${i + 1}  ${h}` })),
        );
        break;

      case "sudo": {
        const sub = arg.trim();
        if (sub === "hire-me" || sub === "hire_me") {
          print([
            { kind: "ok", text: c.sudoHire },
            { kind: "dim", text: `email: ${personal.email}` },
          ]);
          document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          break;
        }
        print([{ kind: "warn", text: c.sudoDenied }]);
        break;
      }

      case "ping":
        print([{ kind: "ok", text: c.ping }]);
        break;

      case "rm":
        print([{ kind: "warn", text: c.rmBlocked }]);
        break;

      case "vim":
      case "vi":
      case "nano":
        print([{ kind: "dim", text: c.vimEscape }]);
        break;

      default:
        print([{ kind: "warn", text: c.unknown(cmd) }]);
    }
  };

  const complete = () => {
    const endsSpace = value.endsWith(" ");
    const tokens = value.split(/\s+/).filter(Boolean);
    const current = endsSpace ? "" : (tokens[tokens.length - 1] ?? "");
    const head = endsSpace ? tokens : tokens.slice(0, -1);

    let candidates: string[] = [];
    if (head.length === 0) {
      candidates = commandNames;
    } else {
      const head0 = head[0].toLowerCase();
      if (head0 === "open" || head0 === "cd" || head0 === "views") {
        candidates = [
          ...posts.map((p) => p.slug),
          ...personal.projects.map((p) => p.slug),
          ...(head0 === "views" ? [] : ["blog", ...sections, ...socialKeys]),
        ];
      } else if (head0 === "cat") {
        candidates = ["about", "contact", "resume"];
      } else if (head0 === "ls") {
        candidates = ["blog", "projects", "socials"];
      } else if (head0 === "theme") {
        candidates = ["dark", "light"];
      } else if (head0 === "lang") {
        candidates = ["zh", "en"];
      }
    }

    const matches = candidates.filter((cand) => cand.startsWith(current) && cand !== current);
    if (matches.length === 1) {
      setValue([...head, matches[0]].join(" ") + " ");
    } else if (matches.length > 1) {
      print([{ kind: "dim", text: matches.join("   ") }]);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      terminalStore.set(false);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      complete();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      if (histIdx < 0) draftRef.current = value;
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setValue(history[next]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setValue(draftRef.current);
        return;
      }
      setHistIdx(next);
      setValue(history[next]);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = value.trim();
    setValue("");
    setHistIdx(-1);
    if (!raw) {
      print([{ kind: "user", text: "" }]);
      return;
    }
    setHistory((prev) => (prev[prev.length - 1] === raw ? prev : [...prev, raw]));
    print([{ kind: "user", text: raw }]);
    run(raw);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-terminal
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 mx-auto bottom-4 sm:bottom-6 z-[90] w-[min(94vw,720px)]"
        >
          <div className="rounded-xl overflow-hidden border border-brand-primary/20 bg-bg-elevated/95 backdrop-blur-md shadow-[var(--fx-loader-glow),var(--shadow-elevated)]">
            <div className="term-chrome flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
              <button
                type="button"
                onClick={() => terminalStore.set(false)}
                aria-label="Close terminal"
                className="size-2.5 rounded-full bg-[#ff5f57] hover:brightness-125 transition"
              />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-brand-glow" />
              <span className="ml-2 font-mono text-[10px] text-text-muted tracking-wide">
                {c.title} — {personal.name}
              </span>
              <span className="ml-auto hidden sm:inline font-mono text-[10px] text-text-muted">
                {c.hint}
              </span>
            </div>

            <div
              ref={scrollRef}
              className="max-h-[min(52vh,440px)] overflow-y-auto px-4 py-4 font-mono text-[11px] sm:text-xs leading-[1.7]"
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    lineClass[line.kind],
                  )}
                >
                  {line.kind === "user" ? (
                    <>
                      <span className="text-brand-glow opacity-70 mr-2 select-none">
                        $
                      </span>
                      {line.text || "\u00a0"}
                    </>
                  ) : (
                    line.text || "\u00a0"
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="term-chrome flex items-center gap-2 border-t border-white/5 bg-black/40 px-4 py-2.5"
            >
              <span className="font-mono text-xs text-brand-glow shrink-0 select-none">
                {c.prompt}
              </span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={c.placeholder}
                aria-label="Terminal input"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent font-mono text-sm text-text-primary outline-none placeholder:text-text-muted caret-brand-glow"
              />
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function isHomePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname === `${basePath}/`;
}
