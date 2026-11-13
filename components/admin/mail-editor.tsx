"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, ListBox, Select, Switch } from "@heroui/react";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

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
          <Switch
            isSelected={form.enabled}
            onChange={(selected) => update({ enabled: selected })}
          >
            <Switch.Content className="text-sm text-text-secondary">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              启用邮件通知
            </Switch.Content>
          </Switch>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          访客在「联系」区块提交留言后，会通过 SMTP 发一封通知邮件到你的邮箱。启用后请填写完整的 SMTP 信息。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SMTP 服务器" value={form.host} onChange={(v) => update({ host: v })} placeholder="smtp.qq.com" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="端口" value={String(form.port)} onChange={(v) => update({ port: Number(v) || 465 })} placeholder="465" />
            <div>
              <Label className={labelCls}>加密方式</Label>
              <Select
                selectedKey={form.secure ? "ssl" : "none"}
                onSelectionChange={(key) => update({ secure: key === "ssl" })}
                aria-label="加密方式"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="ssl">SSL(465)</ListBox.Item>
                    <ListBox.Item id="none">无加密(25)</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
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
          role="status"
          aria-live="polite"
          className={cn(
            "text-sm",
            status.type === "success" ? "text-emerald-400" : "text-red-400",
          )}
        >
          {status.text}
        </p>
      )}

      <Button variant="primary" className="min-h-11 sm:min-h-0" onPress={onSave} isDisabled={saving}>
        <Save size={16} />
        {saving ? "保存中..." : "保存设置"}
      </Button>
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
    <div className="block space-y-1">
      <Label className={labelCls}>{label}</Label>
      <Input
        fullWidth
        aria-label={label}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
