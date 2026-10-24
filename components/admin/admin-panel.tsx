"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, FileText, UserRound, Mail, ArrowUp, ArrowDown } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { PostEditor } from "./post-editor";
import { PersonalEditor } from "./personal-editor";
import { MailEditor } from "./mail-editor";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

type Tab = "posts" | "personal" | "mail";

export function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");

  async function handleLogout() {
    try {
      await fetch(apiUrl("/api/admin/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>admin</SectionLabel>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            管理后台
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/zh"
            className="rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs text-text-secondary hover:text-text-brand hover:border-brand-primary/40 transition-colors"
          >
            查看网站
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs text-text-secondary hover:text-text-brand hover:border-brand-primary/40 transition-colors"
          >
            <LogOut size={12} />
            退出
          </button>
        </div>
      </header>

      <nav className="mt-6 flex gap-2 border-b border-brand-primary/10 pb-px">
        <TabButton
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          icon={<FileText size={14} />}
          label="博客文章"
        />
        <TabButton
          active={tab === "personal"}
          onClick={() => setTab("personal")}
          icon={<UserRound size={14} />}
          label="个人信息"
        />
        <TabButton
          active={tab === "mail"}
          onClick={() => setTab("mail")}
          icon={<Mail size={14} />}
          label="邮件通知"
        />
      </nav>

      <div className="mt-8">
        {tab === "posts" ? (
          <PostEditor />
        ) : tab === "personal" ? (
          <PersonalEditor />
        ) : (
          <MailEditor />
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="回到顶部"
          className="flex size-10 items-center justify-center rounded-full border border-brand-primary/30 bg-bg-elevated text-text-secondary shadow-[var(--shadow-elevated)] hover:text-text-brand hover:border-brand-primary/60 transition-colors"
        >
          <ArrowUp size={18} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })}
          aria-label="回到底部"
          className="flex size-10 items-center justify-center rounded-full border border-brand-primary/30 bg-bg-elevated text-text-secondary shadow-[var(--shadow-elevated)] hover:text-text-brand hover:border-brand-primary/60 transition-colors"
        >
          <ArrowDown size={18} />
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
        active
          ? "border-brand-primary text-text-brand"
          : "border-transparent text-text-muted hover:text-text-secondary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
