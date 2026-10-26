"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Rocket, Sparkles } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { TagInput } from "./tag-input";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import type { EmojiItem } from "@/lib/emoji";

const inputCls =
  "w-full rounded-xl border border-brand-primary/20 bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-brand-primary/60 transition-colors";

export function PostEditor() {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [languages, setLanguages] = useState<string[]>(["zh"]);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoSlug = useMemo(() => {
    const slugified = title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slugified || "untitled";
  }, [title]);

  function toggleLang(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang],
    );
  }

  function insertEmoji(emoji: EmojiItem) {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + emoji.shortcode);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji.shortcode + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.shortcode.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ type: "idle", text: "" });

    if (languages.length === 0) {
      setStatus({ type: "error", text: "请至少选择一种语言" });
      return;
    }

    const payload = {
      slug: slug.trim() || autoSlug,
      title,
      description,
      date,
      tags,
      content,
      languages,
    };

    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/admin/posts"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({
          type: "error",
          text: data?.error ?? "发布失败",
        });
        return;
      }
      setStatus({
        type: "success",
        text: `已发布:${data.languages.map((l: string) => `/${l}/blog/${data.slug}`).join(" ")}`,
      });
      setContent("");
      setDescription("");
      setTags([]);
    } catch {
      setStatus({ type: "error", text: "网络错误,请重试" });
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = useMemo(() => {
    let html = content;
    html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img alt="$1" src="$2" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]*)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/^\s*#{1,3}\s+(.+)$/gm, (m, txt) => `<h2>${txt}</h2>`);
    html = html.replace(/^(\s*)[-*]\s+(.+)$/gm, "<li>$2</li>");
    html = html
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.startsWith("<")) return line;
        return `<p>${line}</p>`;
      })
      .join("\n");
    return html;
  }, [content]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
            基本信息
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs text-text-secondary">
                标题 *
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs text-text-secondary">
                Slug(留空自动生成)
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={autoSlug}
                className={cn(inputCls, "font-mono")}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-text-secondary">
              描述(用于 SEO 和摘要)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="一句话介绍这篇文章"
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs text-text-secondary">
                日期 *
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs text-text-secondary">
                标签
              </span>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="nextjs, react, 随笔"
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-xs text-text-secondary">
              发布语言
            </legend>
            <div className="flex gap-2">
              {["zh", "en"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLang(lang)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm border transition-colors",
                    languages.includes(lang)
                      ? "bg-brand-primary/20 border-brand-primary/50 text-text-brand"
                      : "border-brand-primary/20 text-text-muted hover:text-text-secondary",
                  )}
                >
                  {lang === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="glass rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
              内容(Markdown)
            </h2>
            <div className="flex items-center gap-2">
              <EmojiPicker onPick={insertEmoji} />
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-brand hover:border-brand-primary/40 transition-colors"
              >
                <Sparkles size={14} />
                预览
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder={"支持 Markdown、GFM 表格、代码高亮和表情短代码,例如 :rocket: :smile:"}
            className={cn(inputCls, "font-mono leading-relaxed")}
          />

          {preview && (
            <div className="rounded-xl border border-brand-primary/20 bg-bg-base/40 p-5">
              <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                preview(简化渲染)
              </p>
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </section>

        {status.text && (
          <p
            className={cn(
              "text-sm",
              status.type === "success" ? "text-emerald-400" : "text-red-400",
            )}
          >
            {status.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || languages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-bg-base hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Rocket size={16} />
          {saving ? "发布中..." : "发布文章"}
        </button>
    </form>
  );
}
