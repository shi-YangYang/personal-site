"use client";

import { useT } from "../providers/i18n-provider";
import { FadeIn } from "../effects/fade-in";
import { SectionLabel } from "../ui/section-label";
import { AnimatedNumber } from "../effects/animated-number";
import { Code3D } from "../effects/code-3d";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { PersonalData } from "@content/data";

export function SkillsSection({
  data,
}: {
  data: PersonalData;
}) {
  const t = useT();
  return (
    <section
      id="skills"
      className="snap-section relative py-14 sm:py-16"
    >
      <Code3D
        className="right-[4%] bottom-[14%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`const stacks = ${data.skills.length} groups;`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("skills.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("skills.title")}
          </h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.skills.map((group, i) => (
            <FadeIn key={group.category} delay={0.1 * i}>
              <div className="glass rounded-2xl p-6 h-full hover:border-brand-primary/40 transition-colors">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-text-brand mb-5">
                    {group.label}
                  </h3>
                  <ul className="space-y-5">
                    {group.items.map((skill) => (
                      <SkillBar key={skill.name} skill={skill} />
                    ))}
                  </ul>
                </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillBar({
  skill,
}: {
  skill: { name: string; level: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <li>
      <div ref={ref} className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm text-text-primary">{skill.name}</span>
        <span className="text-[10px] font-mono text-text-brand tabular-nums">
          <AnimatedNumber value={skill.level} suffix="%" />
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
          initial={{ width: 0 }}
          animate={inView ? { width: `${skill.level}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </li>
  );
}
