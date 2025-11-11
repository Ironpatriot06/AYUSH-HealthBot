// components/FloatingChatWidget.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

const CHAT_TIMEOUT_MS = 35000; // 35s client timeout

// ✅ Code renderer typed via public API (no internal imports)
const CodeBlock: NonNullable<Components["code"]> = ({
  inline,
  className,
  children,
}) => {
  if (inline) {
    return (
      <code className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-900">
        {children}
      </code>
    );
  }
  return (
    <pre className="p-2 rounded bg-emerald-100 overflow-x-auto">
      <code className={className}>{children}</code>
    </pre>
  );
};

// Markdown component overrides for tidy chat formatting
const mdComponents: Components = {
  ul: (props) => <ul className="list-disc pl-5 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
  li: (props) => <li className="[&>p]:m-0" {...props} />,
  p: (props) => <p className="leading-relaxed my-2" {...props} />,
  h1: (props) => <h1 className="text-base font-semibold mt-1 mb-2" {...props} />,
  h2: (props) => <h2 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  h3: (props) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  code: CodeBlock,
};

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "👋 **Namaste! I’m your Ayurveda assistant.**\n\nAsk about a **herb** (Tulsi, Ashwagandha, Neem), a **concern** (cold, headache, digestion), or **dosage/preparations**.\n\n_Pro tip:_ Try “Remedies for common cold → short bullets.”",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, open]);

  function addMessage(role: Message["role"], text: string) {
    setMessages((m) => [...m, { id: `${Date.now()}-${Math.random()}`, role, text }]);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    addMessage("user", trimmed);
    setInput("");
    setLoading(true);

    // cancel previous request if any
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          question: trimmed,
          formatting_hint:
            "Format for chat: short bullets, **bold** for key terms, emojis as icons (🌿,🍵,💧,🛌), arrows (→) for dosage/precautions, avoid long paragraphs, no nested lists deeper than 1.",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        addMessage(
          "assistant",
          `Sorry, I couldn't answer right now.\n\n**Status:** ${res.status}${
            text ? `\n\n**Details:** ${text}` : ""
          }`
        );
        return;
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        addMessage("assistant", "I received an empty/invalid response. Please try again.");
        return;
      }

      addMessage("assistant", data?.answer || "I don't know.");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        addMessage(
          "assistant",
          "⏱️ The request took too long and was cancelled. Please try again or rephrase."
        );
      } else {
        addMessage("assistant", `🌐 Network error: ${err?.message || "unknown"}`);
      }
    } finally {
      clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <button
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.84L3 20l1.16-3.28A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-3 w-80 md:w-96">
          <Card className="flex flex-col h-[28rem]">
            <CardHeader className="px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>AP</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm">Ayurveda Bot</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    Ask about herbs, remedies, or cultivation
                  </div>
                </div>
                <div className="ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setMessages([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2 flex-1 overflow-auto" ref={containerRef}>
              <div className="flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    Hi! Ask me about a plant or describe a symptom.
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[80%] px-3 py-2 rounded-2xl shadow-sm",
                          isUser
                            ? "bg-emerald-500 text-white text-sm"
                            : "bg-emerald-50 text-emerald-900 text-sm border border-emerald-100",
                        ].join(" ")}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        ) : (
                          <div className="prose prose-emerald prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-strong:font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                              {m.text}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-emerald-50 text-emerald-900 text-sm px-3 py-2 rounded-2xl border border-emerald-100">
                      <span className="inline-flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        Thinking…
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="px-3 py-2 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={loading ? "Thinking…" : "Type your question..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading}>
                  {loading ? "…" : "Send"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
