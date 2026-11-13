"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, ListBox, Select } from "@heroui/react";
import { Cpu, List, Save, TestTube2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

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

        <div className="block space-y-1">
          <Label className="text-xs text-text-secondary">Base URL</Label>
          <Input
            fullWidth
            aria-label="Base URL"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://api.deepseek.com/v1"
            className="font-mono"
            autoComplete="off"
          />
        </div>

        <div className="block space-y-1">
          <Label className="text-xs text-text-secondary">API Key</Label>
          <Input
            fullWidth
            aria-label="API Key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={apiKeySet ? "已配置，留空保持不变" : "sk-..."}
            className="font-mono"
            autoComplete="new-password"
          />
        </div>

        <div className="block space-y-1">
          <Label className="text-xs text-text-secondary">Model</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              fullWidth
              aria-label="Model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="deepseek-chat"
              className="font-mono"
              autoComplete="off"
            />
            {models.length > 0 && (
              <Select
                className="sm:w-64"
                selectedKey={models.includes(model) ? model : null}
                onSelectionChange={(key) => {
                  if (key) setModel(String(key));
                }}
                aria-label="从模型列表选择"
                placeholder="从列表选择"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {models.map((item) => (
                      <ListBox.Item key={item} id={item}>
                        {item}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onPress={onListModels}
            isDisabled={listing || !baseUrl || (!apiKey && !apiKeySet)}
          >
            <List size={14} />
            {listing ? "获取中..." : "获取模型列表"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={onTest}
            isDisabled={testing || !baseUrl || !model || (!apiKey && !apiKeySet)}
          >
            <TestTube2 size={14} />
            {testing ? "测试中..." : "测试连接"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onPress={onSave}
            isDisabled={saving || !baseUrl || !model || (!apiKey && !apiKeySet)}
          >
            <Save size={14} />
            {saving ? "保存中..." : "保存配置"}
          </Button>
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
