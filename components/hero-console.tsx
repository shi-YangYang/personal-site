"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bot, CloudRain } from "lucide-react";
import type { PersonalData } from "@/content/data";
import type { Messages } from "@/lib/messages";
import { useI18n } from "./i18n-provider";
import { Hero3D } from "./hero-3d";
import { FadeIn } from "./fade-in";
import { agentStore } from "@/lib/agent-store";
import { fxStore } from "@/lib/fx-store";

const panelCopy = {
  zh: {
    online: "在线",
    agentReady: "站内检索就绪",
    prompt: "问我的系统…",
    send: "询问",
    metrics: { projects: "项目", posts: "文章", skills: "技术组" },
    rain: "数据雨",
    rainOn: "开",
    rainOff: "关",
  },
  en: {
    online: "online",
    agentReady: "site retrieval ready",
    prompt: "Ask my system…",
    send: "Ask",
    metrics: { projects: "projects", posts: "posts", skills: "skill groups" },
    rain: "data rain",
    rainOn: "on",
    rainOff: "off",
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

  const ask = (value: string) => {
    const next = value.trim() || t.prompt;
    setQuestion("");
    agentStore.open(next);
  };

  return (
    <>
      <section
        id="home"
        className="snap-section relative flex min-h-[100svh] items-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-glow-radial" />
        <Hero3D />
        <div className="scanlines pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/5 px-3 py-1 font-mono text-[10px] text-text-brand">
                <span className="size-1.5 rounded-full bg-brand-glow" />
                <span className="text-text-muted">{data.role}</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="mt-7 text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.055em] text-depth">
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
                  href={`/${locale}/projects`}
                  scroll={false}
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-bg-base transition-all hover:glow"
                >
                  {messages.hero.cta_primary}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2}>
            <div className="relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-bg-elevated/70 shadow-[0_30px_90px_-40px_rgba(16,185,129,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 bg-brand-primary/[0.05] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#ff5f57]" />
                  <span className="size-2 rounded-full bg-[#febc2e]" />
                  <span className="size-2 rounded-full bg-brand-glow" />
                  <span className="ml-2 font-mono text-[10px] tracking-[0.08em] text-text-secondary">
                    operator@personal-site
                  </span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                  <span className="size-1.5 rounded-full bg-brand-glow" />
                  {t.online}
                </span>
              </div>

              <div className="space-y-4 px-4 py-5 font-mono text-[11px] leading-relaxed">
                <p className="text-text-muted">
                  <span className="text-brand-glow">$</span> whoami
                  <span className="mt-1 block pl-4 text-text-primary">
                    {data.name} <span className="text-text-muted">/</span>{" "}
                    {data.role}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-text-muted">
                  <span className="text-brand-glow">$</span> agent --status
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] text-text-brand">
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
                className="px-3 pb-3"
              >
                <div className="flex items-center gap-2 rounded-lg bg-bg-base px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow focus-within:ring-1 focus-within:ring-brand-primary/30">
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
                    className="rounded-md p-1 text-text-brand transition-colors hover:bg-brand-primary/10"
                    aria-label={t.send}
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </form>
            </div>
          </FadeIn>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-text-muted animate-bounce">
          <ArrowDown size={18} />
        </div>
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 border-t border-brand-primary/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        <span className="flex items-center gap-2">
          <span className="text-text-brand">
            {String(data.projects.length).padStart(2, "0")}
          </span>
          {t.metrics.projects}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-text-brand">
            {String(postCount).padStart(2, "0")}
          </span>
          {t.metrics.posts}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-text-brand">
            {String(data.skills.length).padStart(2, "0")}
          </span>
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
    </>
  );
}
