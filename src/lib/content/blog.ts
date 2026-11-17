import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Locale } from "../i18n";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type Heading = {
  id: string;
  text: string;
  level: number;
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: string;
  headings: Heading[];
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

function getDir(locale: Locale) {
  return path.join(CONTENT_DIR, locale);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[*_~]+/g, "");
}

function slugify(text: string): string {
  return stripMarkdown(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const counts = new Map<string, number>();
  const re = /^(#{1,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const level = match[1].length;
    const text = stripMarkdown(match[2].trim());
    let id = slugify(match[2]);
    const seen = counts.get(id) ?? 0;
    counts.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen}`;
    headings.push({ id, text, level });
  }
  return headings;
}

function parseFile(locale: Locale, filename: string): BlogPost {
  const slug = filename.replace(/\.mdx?$/, "");
  const filePath = path.join(getDir(locale), filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date instanceof Date ? data.date.toISOString() : String(data.date ?? ""),
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingTime: stats.text,
    headings: getHeadings(content),
    content,
  };
}

const postCache = new Map<string, { mtimeMs: number; post: BlogPost }>();

function cachedParseFile(locale: Locale, filename: string): BlogPost {
  const filePath = path.join(getDir(locale), filename);
  const key = `${locale}/${filename}`;
  try {
    const stat = fs.statSync(filePath);
    const hit = postCache.get(key);
    if (hit && hit.mtimeMs === stat.mtimeMs) return hit.post;
    const post = parseFile(locale, filename);
    postCache.set(key, { mtimeMs: stat.mtimeMs, post });
    return post;
  } catch {
    return parseFile(locale, filename);
  }
}

export function getAllPosts(locale: Locale): BlogPostMeta[] {
  const dir = getDir(locale);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f));
  return files
    .map((f) => cachedParseFile(locale, f))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _omit, ...meta }) => meta);
}

export function getPost(locale: Locale, slug: string): BlogPost | null {
  for (const ext of [".mdx", ".md"]) {
    const filename = `${slug}${ext}`;
    const filePath = path.join(getDir(locale), filename);
    if (fs.existsSync(filePath)) return cachedParseFile(locale, filename);
  }
  return null;
}
