"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bot, CloudRain, TerminalSquare } from "lucide-react";
import type { PersonalData } from "@/content/data";
import type { Messages } from "@/lib/messages";
import { useI18n } from "./i18n-provider";
import { Hero3D } from "./hero-3d";
import { TypingText } from "./typing-text";
import { FadeIn } from "./fade-in";
import { agentStore } from "@/lib/agent-store";
import { fxStore } from "@/lib/fx-store";
import { terminalStore } from "@/lib/terminal-store";

const panelCopy = {
  zh: {
    terminal: "系统终端",
    online: "在线",
    agentReady: "站内检索就绪",
    prompt: "问我的系统…",
    send: "询问",
    whoami: "全栈工程师",
    stack: "技术栈",
    status: "状态",
    open: "开放合作",
    metrics: { projects: "项目", posts: "文章", skills: "技术组" },
    rain: "数据雨",
    rainOn: "开",
    rainOff: "关",
    hint: "⌘J Agent · ~ 终端",
  },
  en: {
    terminal: "system terminal",
    online: "online",
    agentReady: "site retrieval ready",
    prompt: "Ask my system…",
    send: "Ask",
    whoami: "full-stack engineer",
    stack: "stack",
    status: "status",
    open: "open to work",
    metrics: { projects: "projects", posts: "posts", skills: "skill groups" },
    rain: "data rain",
    rainOn: "on",
    rainOff: "off",
    hint: "⌘J agent · ~ terminal",
  },
} as const;

export function HeroConsole({
  data,
  messages,
  postCount,
}: {
  data: PersonalData;
  messages: Messages;
  postCount: number;
}) {
  const { locale } = useI18n();
  const t = panelCopy[locale];
  const [question, setQuestion] = useState("");
  const [rain, setRain] = useState(false);

  useEffect(() => fxStore.subscribe(setRain), []);

  const stack = data.skills
    .flatMap((group) => group.items.map((item) => item.name))
    .slice(0, 4);

  const ask = (value: string) => {
    const next = value.trim() || t.prompt;
    setQuestion("");
    agentStore.open(next);
  };

  return (
    <section
      id="home"
      className="snap-section relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute inset-0 bg-glow-radial" />
      <Hero3D />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        <div>
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/5 px-3 py-1 font-mono text-[10px] text-text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-glow" />
              <span className="text-text-muted">SYSTEM ONLINE</span>
              <span className="text-brand-primary/40">/</span>
              <TypingText texts={messages.hero.type_lines} speed={45} hold={2400} delay={250} />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1
              className="glitch mt-7 text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.055em] text-depth"
              data-text={data.name}
            >
              {data.name}
            </h1>
            <p className="mt-3 text-[clamp(1.35rem,3vw,2.2rem)] font-semibold tracking-tight text-gradient">
              {data.tagline}
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {data.bio}
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-bg-base transition-all hover:glow"
              >
                {messages.hero.cta_primary}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => agentStore.open()}
                className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 px-5 py-2.5 text-sm text-text-primary transition-all hover:border-brand-primary/60 hover:bg-brand-primary/5"
              >
                <Bot size={15} className="text-text-brand" />
                {locale === "zh" ? "问 Agent" : "Ask Agent"}
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
              <span className="flex items-center gap-2">
                <span className="text-text-brand">{String(data.projects.length).padStart(2, "0")}</span>
                {t.metrics.projects}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-text-brand">{String(postCount).padStart(2, "0")}</span>
                {t.metrics.posts}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-text-brand">{String(data.skills.length).padStart(2, "0")}</span>
                {t.metrics.skills}
              </span>
              <button
                type="button"
                onClick={() => fxStore.toggle()}
                aria-pressed={rain}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 px-2.5 py-1 text-text-muted transition-colors hover:border-brand-primary/50 hover:text-text-brand"
              >
                <CloudRain size={12} />
                {t.rain} {rain ? t.rainOn : t.rainOff}
              </button>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="glass relative overflow-hidden rounded-2xl border-brand-primary/20 shadow-[0_30px_90px_-40px_rgba(16,185,129,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-brand-primary/15 bg-black/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#ff5f57]" />
                <span className="size-2 rounded-full bg-[#febc2e]" />
                <span className="size-2 rounded-full bg-brand-glow" />
                <span className="ml-2 font-mono text-[10px] tracking-[0.08em] text-text-secondary">
                  operator@personal-site
                </span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-brand-glow" />
                {t.online}
              </span>
            </div>

            <div className="space-y-3 px-4 py-4 font-mono text-[11px] leading-relaxed">
              <p className="text-text-muted">
                <span className="text-brand-glow">$</span> whoami
                <span className="mt-1 block pl-4 text-text-primary">
                  {data.name} <span className="text-text-muted">/</span> {data.role}
                </span>
              </p>
              <p className="text-text-muted">
                <span className="text-brand-glow">$</span> {t.status}
                <span className="mt-1 block pl-4 text-text-brand">
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-brand-glow align-middle" />
                  {t.open} · {data.location}
                </span>
              </p>
              <p className="text-text-muted">
                <span className="text-brand-glow">$</span> {t.stack}
                <span className="mt-1 block pl-4 text-text-secondary">{stack.join(" / ")}</span>
              </p>
              <p className="flex items-center gap-2 text-text-muted">
                <span className="text-brand-glow">$</span> agent --status
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 px-2 py-0.5 text-[9px] text-text-brand">
                  <Bot size={10} />
                  {t.agentReady}
                </span>
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                ask(question);
              }}
              className="border-t border-brand-primary/15 bg-black/20 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 rounded-lg border border-brand-primary/20 bg-bg-base/40 px-3 py-2 transition-colors focus-within:border-brand-primary/60">
                <span className="font-mono text-xs text-brand-glow">$</span>
                <label htmlFor="hero-agent-question" className="sr-only">
                  {t.prompt}
                </label>
                <input
                  id="hero-agent-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t.prompt}
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-text-primary outline-none placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  className="rounded-md border border-brand-primary/25 p-1 text-text-brand transition-colors hover:bg-brand-primary/10"
                  aria-label={t.send}
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between border-t border-brand-primary/10 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
              <span className="truncate">{t.hint}</span>
              <button
                type="button"
                onClick={() => terminalStore.toggle()}
                className="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-text-brand"
              >
                <TerminalSquare size={11} />
                terminal
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-text-muted animate-bounce">
        <ArrowDown size={18} />
      </div>
    </section>
  );
}
