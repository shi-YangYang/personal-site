"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { localeNames, type Locale } from "@/lib/i18n";
import type { PersonalDataRecord } from "@/lib/personal";

type PreviewPanel = "basic" | "skills" | "experience" | "projects" | "links";

const PREVIEW_KEY = "admin-preview-v1";

export function PersonalPreview({
  record,
  locale,
  dirty,
  panel,
  postCount,
}: {
  record: PersonalDataRecord;
  locale: Locale;
  dirty: boolean;
  panel: PreviewPanel;
  postCount: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [expanded, setExpanded] = useState(false);
  const section = panel === "basic" ? "home" : panel;

  const send = useCallback(() => {
    const payload = {
      type: "admin-preview",
      data: record,
      locale,
      section,
      postCount,
    };
    try {
      sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(payload));
    } catch {
      // The iframe can still receive the postMessage.
    }
    iframeRef.current?.contentWindow?.postMessage(payload, window.location.origin);
  }, [record, locale, section, postCount]);

  useEffect(() => {
    send();
  }, [send]);

  return (
    <div
      data-preview-expanded={expanded ? "true" : undefined}
      className={
        expanded
          ? "fixed inset-0 z-[80] bg-bg-base p-4 sm:p-6"
          : "flex h-full flex-col gap-2"
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-primary/15 bg-bg-base">
        <div className="flex items-center justify-between border-b border-brand-primary/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em]">
          <span className="text-text-brand">实时预览</span>
          <div className="flex items-center gap-3">
            <span className="text-text-muted">
              {localeNames[locale]} · {dirty ? "未保存" : "已保存"}
            </span>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-text-muted transition-colors hover:bg-brand-primary/10 hover:text-text-brand"
              aria-label={expanded ? "退出全屏预览" : "全屏预览"}
            >
              {expanded ? <X size={12} /> : <Maximize2 size={12} />}
              {expanded ? "关闭" : "全屏"}
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          src="/preview"
          title="实时预览"
          onLoad={send}
          className="block min-h-0 w-full flex-1 bg-bg-base max-xl:h-[min(72vh,720px)] max-xl:flex-none"
        />
      </div>
      {!expanded && (
        <p className="px-1 text-[10px] leading-relaxed text-text-muted">
          与站点同源渲染的 iframe 预览，按当前编辑中的数据实时更新。
        </p>
      )}
    </div>
  );
}
