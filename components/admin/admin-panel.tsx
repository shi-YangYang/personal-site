"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Tabs } from "@heroui/react";
import { LogOut, UserRound, Mail, Cpu, ArrowUp, ArrowDown } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { PersonalEditor } from "./personal-editor";
import { MailEditor } from "./mail-editor";
import { ModelEditor } from "./model-editor";
import { apiUrl } from "@/lib/api";

type Tab = "personal" | "mail" | "model";

function parseTab(value: string | null): Tab {
  return value === "mail" || value === "model" ? value : "personal";
}

export function AdminPanel({
  postCounts,
}: {
  postCounts: Record<"zh" | "en", number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get("tab")));

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
    <div className="mx-auto max-w-7xl px-6 py-10">
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
          <Button
            variant="secondary"
            size="sm"
            onPress={handleLogout}
          >
            <LogOut size={12} />
            退出
          </Button>
        </div>
      </header>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => {
          const next = parseTab(String(key));
          setTab(next);
          router.replace(`/admin?tab=${next}`, { scroll: false });
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
        }}
        className="mt-6"
      >
        <Tabs.ListContainer className="max-w-xl">
          <Tabs.List aria-label="管理后台分区">
            <Tabs.Tab id="personal">
              <UserRound size={14} />
              个人信息
            </Tabs.Tab>
            <Tabs.Tab id="mail">
              <Mail size={14} />
              邮件通知
            </Tabs.Tab>
            <Tabs.Tab id="model">
              <Cpu size={14} />
              模型配置
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="personal" className="mt-8">
          <PersonalEditor postCounts={postCounts} />
        </Tabs.Panel>
        <Tabs.Panel id="mail" className="mt-8">
          <MailEditor />
        </Tabs.Panel>
        <Tabs.Panel id="model" className="mt-8">
          <ModelEditor />
        </Tabs.Panel>
      </Tabs>

      <div className="admin-scroll-buttons fixed bottom-6 right-6 z-40 hidden flex-col gap-2 sm:flex">
        <Button
          isIconOnly
          variant="secondary"
          aria-label="回到顶部"
          onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={18} />
        </Button>
        <Button
          isIconOnly
          variant="secondary"
          aria-label="回到底部"
          onPress={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })}
        >
          <ArrowDown size={18} />
        </Button>
      </div>
    </div>
  );
}
