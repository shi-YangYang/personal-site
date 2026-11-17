"use client";

import { useT } from "../providers/i18n-provider";
import { FadeIn } from "../effects/fade-in";
import { SectionLabel } from "../ui/section-label";
import { SpotlightCard } from "../effects/spotlight-card";
import { BorderBeam } from "../effects/border-beam";
import { Code3D } from "../effects/code-3d";
import { MapPin, Briefcase, GraduationCap } from "lucide-react";
import type { PersonalData } from "@content/data";

export function AboutSection({
  data,
}: {
  data: PersonalData;
}) {
  const t = useT();
  return (
    <section
      id="about"
      className="snap-section relative py-14 sm:py-16"
    >
      <Code3D
        className="right-[4%] top-[12%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`const me = { role: "${data.role}" };`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("about.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("about.title")}
          </h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <FadeIn delay={0.1} className="lg:col-span-3">
            <BorderBeam className="rounded-2xl" duration={5}>
              <SpotlightCard className="p-6 sm:p-8 h-full">
                <p className="text-text-secondary leading-relaxed text-base sm:text-lg">
                  {data.bio}
                </p>
              </SpotlightCard>
            </BorderBeam>
          </FadeIn>

          <FadeIn delay={0.2} className="lg:col-span-2">
            <BorderBeam className="rounded-2xl" duration={5} delay={1}>
              <SpotlightCard className="p-6 sm:p-8 h-full flex flex-col gap-4">
                <InfoRow
                  icon={<MapPin size={16} />}
                  label={t("about.location")}
                  value={data.location}
                />
                <InfoRow
                  icon={<Briefcase size={16} />}
                  label={t("about.status")}
                  value={t("about.status_value")}
                  accent
                />
                <InfoRow
                  icon={<GraduationCap size={16} />}
                  label={t("about.background")}
                  value={t("about.background_value")}
                />
              </SpotlightCard>
            </BorderBeam>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-text-brand">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wider">
          {label}
        </div>
        <div
          className={
            accent
              ? "text-text-brand font-medium"
              : "text-text-primary mt-0.5"
          }
        >
          {value}
        </div>
      </div>
      {accent && (
        <span className="size-2 rounded-full bg-brand-glow animate-pulse mt-2" />
      )}
    </div>
  );
}
