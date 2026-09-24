"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "./i18n-provider";
import type { Locale } from "@/lib/i18n";

type BootLine = {
  text: string;
  level: "ok" | "warn" | "dim" | "cmd";
};

const bootLines: Record<Locale, BootLine[]> = {
  zh: [
    { text: "开机自检:确认一下今天是不是周一", level: "dim" },
    { text: "眼睛已成功睁开,模式:清醒", level: "ok" },
    { text: "咖啡因注入成功,能量值:满格", level: "ok" },
    { text: "头发又少了一根,不影响输出", level: "warn" },
    { text: "已把 bug 改名为 feature,心里踏实了", level: "ok" },
    { text: "今天也是元气满满的一天呢", level: "ok" },
    { text: "确认世界和平,服务器没崩", level: "ok" },
    { text: "开始干活! ▊", level: "cmd" },
    { text: "tip: 按 ~ 或 ⌘K 唤出访客终端,和这台机器对话", level: "dim" },
  ],
  en: [
    { text: "self-check: is it Monday again?", level: "dim" },
    { text: "eyes opened successfully. mode: awake", level: "ok" },
    { text: "caffeine injected. energy: max", level: "ok" },
    { text: "lost one hair. output unaffected", level: "warn" },
    { text: "renamed \"bug\" to \"feature\", all good", level: "ok" },
    { text: "feeling extra productive today", level: "ok" },
    { text: "confirmed: world peace, servers alive", level: "ok" },
    { text: "let's ship! ▊", level: "cmd" },
    { text: "tip: press ~ or ⌘K to summon the visitor terminal", level: "dim" },
  ],
};

export { bootLines };

const windowTitles: Record<Locale, string> = {
  zh: "开发者摸鱼终端",
  en: "dev chill terminal",
};

const levelClass: Record<BootLine["level"], string> = {
  ok: "text-brand-glow",
  warn: "text-yellow-400",
  dim: "text-text-muted",
  cmd: "text-text-brand",
};

const levelPrefix: Record<BootLine["level"], string> = {
  ok: "✓",
  warn: "!",
  dim: "·",
  cmd: "$",
};

export function BootLoader() {
  const { locale } = useI18n();
  const lines = bootLines[locale];
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < lines.length) {
      const t = setTimeout(
        () => setStep((s) => s + 1),
        step === 0 ? 250 : 140,
      );
      return () => clearTimeout(t);
    }
    const hide = setTimeout(() => setVisible(false), 1900);
    return () => clearTimeout(hide);
  }, [step, lines.length]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        setVisible(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-[100] bg-bg-base flex items-center justify-center px-6 cursor-default"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-[min(92vw,440px)] rounded-xl overflow-hidden border border-brand-primary/20 bg-bg-elevated shadow-[var(--fx-loader-glow)]"
          >
            {/* window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-brand-glow" />
              <span className="ml-2 font-mono text-[10px] text-text-muted tracking-wide">
                {windowTitles[locale]}
              </span>
            </div>

            {/* boot log */}
            <div className="px-4 py-4 font-mono text-[11px] sm:text-xs leading-[1.7]">
              {lines.slice(0, step).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12 }}
                  className={levelClass[line.level]}
                >
                  <span className="opacity-60 mr-2">
                    {levelPrefix[line.level]}
                  </span>
                  {line.text}
                </motion.div>
              ))}
              {step < lines.length && (
                <span className="inline-block w-2 h-3.5 align-middle bg-brand-glow/80 animate-pulse" />
              )}
            </div>
          </motion.div>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-text-muted">
            {locale === "zh" ? "点击任意处跳过" : "click anywhere to skip"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
