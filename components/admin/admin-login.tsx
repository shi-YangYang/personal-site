"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/section-label";
import { apiUrl } from "@/lib/api";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "登录失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <SectionLabel>admin</SectionLabel>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">管理后台</h1>
        <p className="mt-2 text-sm text-text-secondary">
          输入管理密码以继续
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            autoFocus
            className="w-full rounded-xl border border-brand-primary/20 bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-brand-primary/60 transition-colors"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-bg-base hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "验证中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
