"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const inputCls =
  "w-full rounded-lg border border-brand-primary/20 bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-brand-primary/60 transition-colors";

const labelCls = "mb-1 block text-xs text-text-secondary";

type MailForm = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  to: string;
  subjectPrefix: string;
  passSet: boolean;
};

const emptyForm: MailForm = {
  enabled: false,
  host: "",
  port: 465,
  secure: true,
  user: "",
  pass: "",
  to: "",
  subjectPrefix: "【个人站留言】",
  passSet: false,
};

export function MailEditor() {
  const [form, setForm] = useState<MailForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/mail"), { credentials: "include" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as MailForm;
        setForm({ ...emptyForm, ...json });
      } catch {
        setStatus({ type: "error", text: "加载失败,请重新登录" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (patch: Partial<MailForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  async function onSave() {
    setSaving(true);
    setStatus({ type: "idle", text: "" });
    try {
      const res = await fetch(apiUrl("/api/admin/mail"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ type: "error", text: json?.error ?? "保存失败" });
        return;
      }
      setStatus({ type: "success", text: "已保存" });
    } catch {
      setStatus({ type: "error", text: "网络错误,请重试" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-bg-elevated rounded" />
        <div className="h-64 w-full bg-bg-elevated rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
            邮件通知设置
          </h2>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="size-4 accent-emerald-500"
            />
            <span className="text-sm text-text-secondary">启用邮件通知</span>
          </label>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          访客在「联系」区块提交留言后，会通过 SMTP 发一封通知邮件到你的邮箱。启用后请填写完整的 SMTP 信息。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SMTP 服务器" value={form.host} onChange={(v) => update({ host: v })} placeholder="smtp.qq.com" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="端口" value={String(form.port)} onChange={(v) => update({ port: Number(v) || 465 })} placeholder="465" />
            <div>
              <span className={labelCls}>加密方式</span>
              <select
                value={form.secure ? "ssl" : "none"}
                onChange={(e) => update({ secure: e.target.value === "ssl" })}
                className={inputCls}
              >
                <option value="ssl">SSL(465)</option>
                <option value="none">无加密(25)</option>
              </select>
            </div>
          </div>
          <Field label="发件邮箱" value={form.user} onChange={(v) => update({ user: v })} placeholder="your@qq.com" />
          <Field
            label="授权码"
            value={form.pass}
            onChange={(v) => update({ pass: v, passSet: true })}
            placeholder={form.passSet ? "已设置(留空保持不变)" : "邮箱 SMTP 授权码"}
            type="password"
          />
          <Field label="收件邮箱(留空同发件)" value={form.to} onChange={(v) => update({ to: v })} placeholder="your@qq.com" />
          <Field label="邮件主题前缀" value={form.subjectPrefix} onChange={(v) => update({ subjectPrefix: v })} placeholder="【个人站留言】" />
        </div>
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
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-bg-base hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        <Save size={16} />
        {saving ? "保存中..." : "保存设置"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}
