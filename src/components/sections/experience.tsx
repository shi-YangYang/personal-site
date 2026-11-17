"use client";

import { useT } from "../providers/i18n-provider";
import { FadeIn } from "../effects/fade-in";
import { SectionLabel } from "../ui/section-label";
import { BorderBeam } from "../effects/border-beam";
import { Code3D } from "../effects/code-3d";
import type { PersonalData } from "@content/data";

export function ExperienceSection({
  data,
}: {
  data: PersonalData;
}) {
  const t = useT();
  return (
    <section
      id="experience"
      className="snap-section relative py-14 sm:py-16"
    >
      <Code3D
        className="left-[4%] top-[14%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`const experience = ${data.experience.length} roles;`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("experience.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("experience.title")}
          </h2>
        </FadeIn>

        <div className="mt-12 relative">
          <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-brand-primary/50 via-brand-primary/20 to-transparent" />
          <div className="space-y-8">
            {data.experience.map((exp, i) => (
              <FadeIn key={`${exp.company}-${exp.period}`} delay={0.1 * i}>
                <div className="relative pl-12 sm:pl-16">
                  <div className="absolute left-4 sm:left-6 top-2 -translate-x-1/2 size-3 rounded-full bg-brand-primary ring-4 ring-bg-base" />
                  <BorderBeam className="rounded-2xl group-hover:shadow-glow" duration={5} delay={i * 1.2}>
                    <div className="glass rounded-2xl p-5 sm:p-6 hover:border-brand-primary/40 transition-colors">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                        <span className="text-xs font-mono text-text-brand">
                          {exp.period}
                        </span>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted">
                          {exp.location}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold">
                        {exp.role}
                      </h3>
                      <div className="text-sm text-text-secondary">
                        {exp.company}
                      </div>
                      <p className="mt-3 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {exp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-brand-primary/20 text-text-brand/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </BorderBeam>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
