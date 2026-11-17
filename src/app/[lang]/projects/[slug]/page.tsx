import { getPersonalData } from "@content/data";
import { getMessages } from "@/lib/i18n/messages";
import { resolveLocale } from "@/lib/i18n/locale";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FadeIn } from "@/components/effects/fade-in";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const GithubIcon = FaGithub as unknown as React.FC<{ size?: number }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);
  const data = await getPersonalData(locale);
  const project = data.projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);
  const data = await getPersonalData(locale);
  const messages = await getMessages(locale);
  const project = data.projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <FadeIn>
        <Link
          href={`/${locale}#projects`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-brand transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {messages.projects.back}
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text-muted mb-4">
            {project.year && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  {project.year}
                </span>
                <span>·</span>
              </>
            )}
            {project.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {project.title}
          </h1>
          {project.description && (
            <p className="text-text-secondary text-lg">{project.description}</p>
          )}

          {(project.links.demo || project.links.code) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {project.links.demo && (
                <Link
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary text-bg-base text-sm font-medium hover:glow transition-all"
                >
                  {messages.projects.view}
                  <ExternalLink size={14} />
                </Link>
              )}
              {project.links.code && (
                <Link
                  href={project.links.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-primary/30 text-text-primary text-sm font-medium hover:border-brand-primary/60 hover:bg-brand-primary/5 transition-all"
                >
                  <GithubIcon size={14} />
                  {messages.projects.code}
                </Link>
              )}
            </div>
          )}
        </header>
      </FadeIn>

      {project.longDescription && (
        <FadeIn delay={0.08}>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line mb-8">
            {project.longDescription}
          </p>
        </FadeIn>
      )}

      {project.highlights && project.highlights.length > 0 && (
        <FadeIn delay={0.1}>
          <section>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand mb-4">
              {messages.projects.highlights}
            </h2>
            <ul className="space-y-2.5">
              {project.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-text-secondary leading-relaxed"
                >
                  <span className="mt-1.5 size-1.5 rounded-full bg-brand-glow shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      )}
    </article>
  );
}
