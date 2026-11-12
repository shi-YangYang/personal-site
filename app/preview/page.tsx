"use client";

import { useEffect, useState } from "react";
import zh from "@/messages/zh.json";
import en from "@/messages/en.json";
import type { Locale } from "@/lib/i18n";
import type { PersonalDataRecord } from "@/lib/personal";
import type { PersonalData } from "@/content/data";
import { I18nProvider } from "@/components/i18n-provider";
import { HeroConsole } from "@/components/hero-console";
import { AboutSection } from "@/components/sections/about";
import { ExperienceSection } from "@/components/sections/experience";
import { SkillsSection } from "@/components/sections/skills";
import { ProjectsSection } from "@/components/sections/projects";
import { LinksSection } from "@/components/sections/links";
import { ContactSection } from "@/components/sections/contact";
import { SectionScroll } from "@/components/section-scroll";

const PREVIEW_KEY = "admin-preview-v1";

type PreviewPayload = {
  type: "admin-preview";
  data: PersonalDataRecord;
  locale: Locale;
  section: string;
  postCount?: number;
};

const messages = { zh, en } as const;

function isPayload(value: unknown): value is PreviewPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PreviewPayload>;
  return (
    payload.type === "admin-preview" &&
    (payload.locale === "zh" || payload.locale === "en") &&
    typeof payload.section === "string" &&
    Boolean(payload.data) &&
    (payload.postCount === undefined || typeof payload.postCount === "number")
  );
}

export default function PreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PREVIEW_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isPayload(parsed)) {
          window.setTimeout(() => setPayload(parsed), 0);
        }
      }
    } catch {
      // Wait for the parent frame to send a payload.
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isPayload(event.data)) setPayload(event.data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-6 text-center font-mono text-xs text-text-muted">
        等待编辑数据…
      </div>
    );
  }

  const { data, locale, section } = payload;
  const personal = data as unknown as PersonalData;
  const copy = messages[locale];

  return (
    <I18nProvider locale={locale} messages={copy}>
      <div className="min-h-screen bg-bg-base">
        <SectionScroll section={section === "home" ? undefined : section} />
        <HeroConsole
          data={personal}
          messages={copy}
          postCount={payload.postCount ?? 0}
        />
        <AboutSection data={personal} />
        <ExperienceSection data={personal} />
        <SkillsSection data={personal} />
        <ProjectsSection data={personal} />
        <LinksSection data={personal} />
        <ContactSection email={personal.email} />
      </div>
    </I18nProvider>
  );
}
