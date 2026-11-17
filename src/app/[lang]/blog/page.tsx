import { getAllPosts } from "@/lib/content/blog";
import { getMessages } from "@/lib/i18n/messages";
import { resolveLocale } from "@/lib/i18n/locale";
import { BlogCard } from "@/components/blog/blog-card";
import { FadeIn } from "@/components/effects/fade-in";
import { SectionLabel } from "@/components/ui/section-label";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const messages = await getMessages(locale);
  return {
    title: messages.blog.title,
    description: messages.blog.subtitle,
    openGraph: {
      title: messages.blog.title,
      description: messages.blog.subtitle,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = resolveLocale(lang);

  const posts = getAllPosts(locale);
  const messages = await getMessages(locale);
  const readLabel = messages.blog.read;
  const tagLabel = messages.blog.label;
  const title = messages.blog.title;
  const subtitle = messages.blog.subtitle;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <FadeIn>
        <SectionLabel>{tagLabel}</SectionLabel>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-text-secondary">{subtitle}</p>
      </FadeIn>

      {posts.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="mt-12 glass rounded-2xl p-8 text-center text-text-muted">
            {messages.blog.empty}
          </div>
        </FadeIn>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post, i) => (
            <FadeIn key={post.slug} delay={0.05 * i}>
              <BlogCard
                post={post}
                href={`/${locale}/blog/${post.slug}`}
                tagHrefBase={`/${locale}/blog/tags`}
                labels={{ tag: tagLabel, read: readLabel }}
              />
            </FadeIn>
          ))}
        </div>
      )}

      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: `.animate-fade-up{opacity:1!important;transform:none!important}`,
          }}
        />
      </noscript>
    </div>
  );
}
