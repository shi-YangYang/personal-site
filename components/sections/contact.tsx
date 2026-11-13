"use client";

import { apiUrl } from "@/lib/api";
import { useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { useT } from "../i18n-provider";
import { useToast } from "../toast";
import { FadeIn } from "../fade-in";
import { SectionLabel } from "../section-label";
import { SpotlightCard } from "../spotlight-card";
import { BorderBeam } from "../border-beam";
import { Code3D } from "../code-3d";
import { Send } from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

export function ContactSection({ email }: { email: string }) {
  const t = useT();
  const showToast = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
      showToast(t("contact.success"), "success");
    } catch {
      setStatus("error");
      showToast(t("contact.error"), "error");
    }
  };

  return (
    <section
      id="contact"
      className="snap-section relative py-14 sm:py-16"
    >
      <Code3D
        className="right-[4%] bottom-[16%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`mail("${email}")`}
      />
      <div className="absolute inset-0 bg-glow-radial opacity-50 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 w-full flex flex-col justify-center flex-1">
        <FadeIn>
          <SectionLabel>{t("contact.label")}</SectionLabel>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            {t("contact.title")}
          </h2>
          <p className="mt-3 text-text-secondary">{t("contact.subtitle")}</p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <BorderBeam className="rounded-2xl mt-10" duration={5}>
            <SpotlightCard className="p-6 sm:p-8">
              <form
                onSubmit={onSubmit}
                className="space-y-5"
              >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("contact.name")}
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                required
              />
              <Field
                label={t("contact.email")}
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                required
              />
            </div>
            <Field
              label={t("contact.message")}
              value={form.message}
              onChange={(v) => setForm((f) => ({ ...f, message: v }))}
              required
              multiline
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                isDisabled={status === "sending"}
                className="group"
              >
                {status === "sending" ? t("contact.sending") : t("contact.send")}
                <Send
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </div>
          </form>
          </SpotlightCard>
          </BorderBeam>
        </FadeIn>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {multiline ? (
        <TextArea
          fullWidth
          aria-label={label}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="resize-none"
        />
      ) : (
        <Input
          fullWidth
          aria-label={label}
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
