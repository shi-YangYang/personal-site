"use client";

import Link from "next/link";
import type { BlogPostMeta } from "@/lib/content/blog";
import { ArrowUpRight } from "lucide-react";

export function BlogCard({
  post,
  href,
  labels,
  tagHrefBase,
}: {
  post: BlogPostMeta;
  href: string;
  labels: { tag: string; read: string };
  tagHrefBase?: string;
}) {
  const date = new Date(post.date).toLocaleDateString(
    post.date.startsWith("2026") ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <div className="group glass rounded-2xl p-6 h-full hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <time className="text-xs font-mono text-text-muted">{date}</time>
        <ArrowUpRight
          size={16}
          className="text-text-muted group-hover:text-text-brand group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
        />
      </div>
      <Link href={href} className="block">
        <h3 className="text-lg font-semibold mb-2 group-hover:text-text-brand transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {post.description}
        </p>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} tag={tag} hrefBase={tagHrefBase} />
          ))}
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {post.readingTime}
        </span>
      </div>
      <Link
        href={href}
        className="mt-3 inline-block text-[10px] font-mono text-text-muted uppercase tracking-wider hover:text-text-brand transition-colors"
      >
        {labels.read}
      </Link>
    </div>
  );
}

function Tag({ tag, hrefBase }: { tag: string; hrefBase?: string }) {
  const cls =
    "text-[10px] font-mono px-2 py-0.5 rounded-full border border-brand-primary/20 text-text-brand/80 transition-colors";
  if (hrefBase) {
    return (
      <Link
        href={`${hrefBase}/${encodeURIComponent(tag)}`}
        className={`${cls} hover:bg-brand-primary/10`}
      >
        #{tag}
      </Link>
    );
  }
  return <span className={cls}>#{tag}</span>;
}
