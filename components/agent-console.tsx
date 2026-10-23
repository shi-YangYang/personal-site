"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { agentStore, type AgentState } from "@/lib/agent-store";

type Citation = { label: string; href: string; kind?: string };

type Message = {
  role: "user" | "agent";
  text: string;
  citations?: Citation[];
  mode?: string;
};

const copy = {
  zh: {
    button: "AGENT",
    title: "agent@personal-site",
    subtitle: "站内检索",
    close: "关闭 Agent",
    greeting: "我是站内 Agent。问我项目、经历、技术栈、博客或联系方式，我会从站内资料里找答案。",
    placeholder: "问我的系统…",
    send: "发送",
    thinking: "检索站内资料…",
    error: "Agent 暂时不可用，请稍后再试。",
    hint: "⌘J 打开 · Esc 关闭",
    suggestions: ["你做过什么项目？", "你的技术栈是什么？", "怎么联系你？"],
  },
  en: {
    button: "AGENT",
    title: "agent@personal-site",
    subtitle: "site retrieval",
    close: "Close agent",
    greeting: "I'm the site agent. Ask about projects, experience, stack, writing, or contact details — I answer from the site content.",
    placeholder: "Ask my system…",
    send: "Send",
    thinking: "Searching the site…",
    error: "The agent is unavailable right now. Try again shortly.",
    hint: "⌘J open · Esc close",
    suggestions: ["What have you built?", "What is your stack?", "How do I reach you?"],
  },
} as const;

export function AgentConsole() {
  const { locale } = useI18n();
  const t = copy[locale];
  const [state, setState] = useState<AgentState>(agentStore.get());
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "agent", text: t.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() => [...t.suggestions]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRequest = useRef(0);
  const sendRef = useRef<(question: string) => void>(() => {});

  useEffect(() => agentStore.subscribe(setState), []);

  useEffect(() => {
    if (!state.open) return;
    window.setTimeout(() => inputRef.current?.focus(), 80);
    endRef.current?.scrollIntoView({ block: "end" });
  }, [state.open, messages.length, loading]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        agentStore.toggle();
      } else if (event.key === "Escape" && agentStore.get().open) {
        agentStore.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || loading) return;
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setLoading(true);
      try {
        const response = await fetch("/api/agent/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, locale }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "agent failed");
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: String(data.answer ?? ""),
            citations: Array.isArray(data.citations) ? data.citations : [],
            mode: data.mode,
          },
        ]);
        if (Array.isArray(data.suggestions) && data.suggestions.length) {
          setSuggestions(data.suggestions.map(String).slice(0, 4));
        }
      } catch {
        setMessages((prev) => [...prev, { role: "agent", text: t.error }]);
      } finally {
        setLoading(false);
      }
    },
    [loading, locale, t.error],
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (!state.open || !state.request) return;
    if (lastRequest.current === state.request.id) return;
    lastRequest.current = state.request.id;
    sendRef.current(state.request.question);
  }, [state.open, state.request]);

  return (
    <>
      <button
        type="button"
        onClick={() => agentStore.toggle()}
        aria-expanded={state.open}
        aria-label={state.open ? t.close : t.button}
        className="fixed bottom-5 right-5 z-[70] hidden items-center gap-2 rounded-full md:inline-flex border border-brand-primary/30 bg-bg-elevated/90 px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] text-text-brand shadow-[0_0_30px_rgba(16,185,129,0.18)] backdrop-blur-xl transition-all hover:border-brand-primary/60 hover:glow sm:bottom-6 sm:right-6"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-glow opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-glow" />
        </span>
        <Bot size={14} />
        {t.button}
        <span className="hidden text-[9px] text-text-muted sm:inline">⌘J</span>
      </button>

      {state.open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          className="fixed inset-x-3 bottom-20 z-[95] flex h-[min(72vh,620px)] flex-col overflow-hidden rounded-2xl border border-brand-primary/25 bg-bg-elevated/95 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[min(94vw,460px)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-brand-primary/15 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex gap-1">
                <span className="size-2 rounded-full bg-[#ff5f57]" />
                <span className="size-2 rounded-full bg-[#febc2e]" />
                <span className="size-2 rounded-full bg-brand-glow" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-text-secondary">
                {t.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted sm:inline">
                {t.subtitle}
              </span>
              <button
                type="button"
                onClick={() => agentStore.close()}
                aria-label={t.close}
                className="rounded-md p-1 text-text-muted transition-colors hover:bg-brand-primary/10 hover:text-text-brand"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 font-mono text-[12px] leading-relaxed">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`}>
                {message.role === "user" ? (
                  <div className="flex gap-2 text-text-primary">
                    <span className="shrink-0 text-brand-glow">$</span>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                ) : (
                  <div className="border-l border-brand-primary/25 pl-3">
                    <div className="mb-1.5 text-[8px] uppercase tracking-[0.14em] text-text-muted">
                      agent / {message.mode === "llm" ? "llm" : "local"}
                    </div>
                    <p className="whitespace-pre-wrap text-text-secondary">{message.text}</p>
                    {message.citations && message.citations.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                        {message.citations.map((citation) => (
                          <li key={`${citation.label}-${citation.href}`}>
                            <a
                              href={citation.href}
                              target={citation.href.startsWith("http") ? "_blank" : undefined}
                              rel={citation.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="text-[10px] text-text-brand underline decoration-brand-primary/30 underline-offset-2 hover:decoration-brand-glow"
                            >
                              {citation.label} ↗
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 border-l border-brand-primary/25 pl-3 text-text-muted">
                <span className="flex gap-1">
                  <span className="size-1 animate-pulse rounded-full bg-brand-glow" />
                  <span className="size-1 animate-pulse rounded-full bg-brand-glow [animation-delay:120ms]" />
                  <span className="size-1 animate-pulse rounded-full bg-brand-glow [animation-delay:240ms]" />
                </span>
                {t.thinking}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-brand-primary/20 px-2.5 py-1 font-mono text-[9px] text-text-secondary transition-colors hover:border-brand-primary/50 hover:text-text-brand"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-brand-primary/15 px-3 py-2.5"
          >
            <span className="shrink-0 font-mono text-xs text-brand-glow">$</span>
            <label htmlFor="agent-input" className="sr-only">
              {t.placeholder}
            </label>
            <input
              ref={inputRef}
              id="agent-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-text-primary outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t.send}
              className="rounded-md p-1.5 text-text-brand transition-colors hover:bg-brand-primary/10 disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </form>
          <div className="border-t border-brand-primary/10 px-4 py-1.5 text-right font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
            {t.hint}
          </div>
        </section>
      )}
    </>
  );
}
