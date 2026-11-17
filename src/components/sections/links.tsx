"use client";

import { useT } from "../providers/i18n-provider";
import { FadeIn } from "../effects/fade-in";
import { SectionLabel } from "../ui/section-label";
import { Code3D } from "../effects/code-3d";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { PersonalData } from "@content/data";


export function LinksSection({ data }: { data: PersonalData }) {
  const t = useT();
  return (
    <section id="links" className="snap-section relative py-14 sm:py-16">
      <Code3D
        className="left-[4%] bottom-[12%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`const friends = ${data.friendLinks.length} sites;`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("links.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("links.title")}
          </h2>
          <p className="mt-3 text-text-secondary">{t("links.subtitle")}</p>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.friendLinks.map((link, i) => (
            <FadeIn key={link.name} delay={0.05 * i}>
              <Link
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass rounded-2xl p-5 h-full flex flex-col gap-3 hover:border-brand-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={link.name} />
                    <h3 className="font-semibold group-hover:text-text-brand transition-colors">
                      {link.name}
                    </h3>
                    <ExternalLink
                      size={14}
                      className="ml-auto text-text-muted group-hover:text-text-brand transition-colors"
                    />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {link.description}
                  </p>
                </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const label =
    parts.length >= 2
      ? (parts[0][0] ?? "") + (parts[1][0] ?? "")
      : name.trim().slice(0, 2);
  return (
    <span
      aria-hidden
      className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-mono text-sm font-bold text-bg-base"
    >
      {label.toUpperCase()}
    </span>
  );
}
