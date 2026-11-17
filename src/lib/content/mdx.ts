import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import type { ReactNode } from "react";

const memo = new Map<string, ReactNode>();

export async function renderPost(opts: {
  key: string;
  content: string;
}): Promise<ReactNode> {
  const cached = memo.get(opts.key);
  if (cached) return cached;

  const { content } = await compileMDX({
    source: opts.content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, [remarkEmoji, { accessible: true }]],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
              properties: { className: ["no-underline"] },
            },
          ],
          [
            rehypePrettyCode,
            {
              theme: "github-dark-dimmed",
              keepBackground: true,
            },
          ],
        ],
      },
    },
  });

  memo.set(opts.key, content);
  return content;
}
