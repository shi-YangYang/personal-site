import { FadeIn } from "@/components/effects/fade-in";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/lib/content/blog";
import { getViews } from "@/lib/content/views";
import { getMessages } from "@/lib/i18n/messages";
import { resolveLocale } from "@/lib/i18n/locale";
import { resolveSourceMtime } from "@/lib/content/mdx-cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ViewCounter } from "@/components/blog/view-counter";
import { Giscus } from "@/components/blog/giscus";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);
  const post = getPost(locale, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const messages = await getMessages(locale);

  const mtimeMs = resolveSourceMtime(locale, slug);
  const key = `${locale}/${slug}:${mtimeMs}`;
  const { renderPost } = await import("@/lib/content/mdx");
  const content = await renderPost({ key, content: post.content });

  const date = new Date(post.date).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const backLabel = messages.blog.back;
  const tocLabel = messages.blog.toc;
  const commentsLabel = messages.blog.comments;
  const views = getViews(post.slug);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <FadeIn>
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-brand transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="mb-10">
          <div className="flex items-center gap-3 text-xs font-mono text-text-muted mb-4">
            <time>{date}</time>
            <span>·</span>
            <span>{post.readingTime}</span>
            <span>·</span>
            <ViewCounter slug={post.slug} initial={views} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-text-secondary text-lg">{post.description}</p>
          )}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/blog/tags/${encodeURIComponent(tag)}`}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-brand-primary/20 text-text-brand/80 hover:bg-brand-primary/10 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>
      </FadeIn>

      {post.headings.length > 0 && (
        <FadeIn delay={0.08}>
          <TableOfContents items={post.headings} label={tocLabel} />
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <div className="prose max-w-none">
          {content}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="mt-16" aria-label={commentsLabel}>
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand mb-4">
            {commentsLabel}
          </h2>
          <Giscus term={`${locale}/${post.slug}`} locale={locale} />
        </section>
      </FadeIn>
    </article>
  );
}
