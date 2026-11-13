"use client";

import { useEffect, useState } from "react";
import { Cpu, List, Save, TestTube2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-brand-primary/20 bg-bg-elevated px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary/60";

type Status = { type: "idle" | "success" | "error"; text: string };

export function ModelEditor() {
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [listing, setListing] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle", text: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/agent"), { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBaseUrl(data.baseUrl ?? "");
        setModel(data.model ?? "");
        setApiKeySet(Boolean(data.apiKeySet));
      } catch {
        setStatus({ type: "error", text: "加载失败，请重新登录" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function post(path: string, body: unknown) {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "请求失败");
    return data;
  }

  async function onSave() {
    setSaving(true);
    setStatus({ type: "idle", text: "" });
    try {
      const data = await post("/api/admin/agent", {
        base_url: baseUrl,
        model,
        api_key: apiKey,
      });
      setApiKeySet(Boolean(data.apiKeySet));
      setApiKey("");
      setStatus({ type: "success", text: "模型配置已保存，下一次 Agent 请求生效" });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  async function onListModels() {
    setListing(true);
    setStatus({ type: "idle", text: "" });
    try {
      const data = await post("/api/admin/agent/models", {
        base_url: baseUrl,
        model,
        api_key: apiKey,
      });
      const next = Array.isArray(data.models) ? data.models.map(String) : [];
      setModels(next);
      if (!model && next[0]) setModel(next[0]);
      setStatus({
        type: "success",
        text: next.length ? `获取到 ${next.length} 个模型` : "接口没有返回模型",
      });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "获取模型列表失败" });
    } finally {
      setListing(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setStatus({ type: "idle", text: "" });
    try {
      const data = await post("/api/admin/agent/test", {
        base_url: baseUrl,
        model,
        api_key: apiKey,
      });
      setStatus({
        type: "success",
        text: `连接成功 · ${data.model} · ${data.latencyMs}ms · ${data.preview}`,
      });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "连接测试失败" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-bg-elevated" />;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <section className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-brand-primary/10 p-2 text-text-brand">
            <Cpu size={16} />
          </span>
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
              模型配置
            </h2>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Base URL</span>
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://api.deepseek.com/v1"
            className={cn(inputCls, "font-mono")}
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={apiKeySet ? "已配置，留空保持不变" : "sk-..."}
            className={cn(inputCls, "font-mono")}
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Model</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="deepseek-chat"
              className={cn(inputCls, "font-mono")}
              autoComplete="off"
            />
            {models.length > 0 && (
              <select
                value={models.includes(model) ? model : ""}
                onChange={(event) => {
                  if (event.target.value) setModel(event.target.value);
                }}
                aria-label="从模型列表选择"
                className="rounded-lg border border-brand-primary/20 bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-primary/60 sm:w-56"
              >
                <option value="">从列表选择</option>
                {models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onListModels}
            disabled={listing || !baseUrl || (!apiKey && !apiKeySet)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-3 py-2 text-xs text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text-brand disabled:opacity-40"
          >
            <List size={14} />
            {listing ? "获取中..." : "获取模型列表"}
          </button>
          <button
            type="button"
            onClick={onTest}
            disabled={testing || !baseUrl || !model || (!apiKey && !apiKeySet)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-3 py-2 text-xs text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text-brand disabled:opacity-40"
          >
            <TestTube2 size={14} />
            {testing ? "测试中..." : "测试连接"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !baseUrl || !model || (!apiKey && !apiKeySet)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-bg-base transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? "保存中..." : "保存配置"}
          </button>
        </div>

        {status.text && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              status.type === "success" ? "text-emerald-400" : "text-red-400",
            )}
          >
            {status.text}
          </p>
        )}
      </section>
    </div>
  );
}
