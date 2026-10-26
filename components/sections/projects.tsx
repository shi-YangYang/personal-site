"use client";

import { useT, useI18n } from "../i18n-provider";
import { FadeIn } from "../fade-in";
import { SectionLabel } from "../section-label";
import { SpotlightCard } from "../spotlight-card";
import { BorderBeam } from "../border-beam";
import { TiltCard } from "../tilt-card";
import { Code3D } from "../code-3d";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import type { PersonalData } from "@/content/data";
import { cn } from "@/lib/utils";

const GithubIcon = FaGithub as unknown as React.FC<{ size?: number }>;

export function ProjectsSection({
  data,
}: {
  data: PersonalData;
}) {
  const t = useT();
  const { locale } = useI18n();
  return (
    <section
      id="projects"
      className="snap-section relative py-14 sm:py-16"
    >
      <Code3D
        className="left-[3%] top-[12%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`const shipped = ${data.projects.length} projects;`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("projects.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("projects.title")}
          </h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.projects.map((project, i) => (
            <FadeIn
              key={project.title}
              delay={0.05 * i}
              className={cn(
                project.size === "large" && "md:col-span-3",
              )}
            >
              <TiltCard className="h-full rounded-2xl overflow-hidden">
                <BorderBeam className="h-full rounded-2xl" duration={6} delay={i * 1.5}>
                  <SpotlightCard className="h-full" solid>
                    <ProjectCardInner
                      index={i}
                      title={project.title}
                      description={project.description}
                      tags={project.tags}
                      links={project.links}
                      large={project.size === "large"}
                      detailHref={`/${locale}/projects/${project.slug}`}
                      viewLabel={t("projects.view")}
                      codeLabel={t("projects.code")}
                      detailsLabel={t("projects.details")}
                    />
                  </SpotlightCard>
                </BorderBeam>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCardInner({
  index,
  title,
  description,
  tags,
  links,
  large,
  detailHref,
  viewLabel,
  codeLabel,
  detailsLabel,
}: {
  index: number;
  title: string;
  description: string;
  tags: string[];
  links: { demo?: string; code?: string };
  large?: boolean;
  detailHref: string;
  viewLabel: string;
  codeLabel: string;
  detailsLabel: string;
}) {
  return (
    <div
      className={cn(
        "group relative p-6 h-full overflow-hidden",
        "hover:-translate-y-0.5 transition-transform duration-300",
        large && "min-h-[230px] flex flex-col justify-between",
      )}
    >
      {large && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 font-mono text-[clamp(6rem,12vw,10rem)] font-bold leading-none text-brand-primary/10"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className={cn("relative", large && "max-w-3xl")}>
        <h3
          className={cn(
            "font-semibold tracking-tight",
            large ? "text-2xl" : "text-lg",
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      <div className={cn("relative mt-6 flex items-end justify-between gap-3 flex-wrap", large && "max-w-3xl")}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-brand-primary/20 text-text-brand/80"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-brand hover:underline transition-colors"
          >
            {detailsLabel}
            <ArrowUpRight size={12} />
          </Link>
          {links.demo && (
            <Link
              href={links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-brand transition-colors"
            >
              {viewLabel}
              <ExternalLink size={12} />
            </Link>
          )}
          {links.code && (
            <Link
              href={links.code}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-brand transition-colors"
            >
              {codeLabel}
              <GithubIcon size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
