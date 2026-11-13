"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
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
          <Input
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={loading || !password}
          >
            {loading ? "验证中..." : "登录"}
          </Button>
        </form>
      </div>
    </div>
  );
}
