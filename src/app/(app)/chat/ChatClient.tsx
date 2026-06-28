"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* /chat — a YouTube-style live-chat-like panel pinned to the right of
 * the page. Falls back gracefully to a centered card on narrow viewports.
 * Uses the same /api/chat endpoint as the floating ChatWidget. */
export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      });

      const convId = res.headers.get("X-Conversation-Id");
      if (convId) setConversationId(convId);

      if (!res.ok || !res.body) {
        const errorText = await res
          .text()
          .catch(() => "Something went wrong");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `[Error: ${errorText}]`,
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `[Error: ${e instanceof Error ? e.message : "connection failed"}]`,
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Live chat</h1>
        <Link
          href="/"
          className="text-sm text-[color:var(--yt-blue)] hover:underline"
        >
          ← Back to home
        </Link>
      </div>

      <div className="bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] rounded-2xl flex flex-col h-[calc(100vh-200px)] min-h-[480px] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[color:var(--yt-border)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium text-sm">voyle</span>
          <span className="text-xs text-[color:var(--yt-text-secondary)]">
            — your host
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[color:var(--yt-bg)]">
          {messages.length === 0 && (
            <div className="text-center text-[color:var(--yt-text-secondary)] text-sm py-12">
              <p className="mb-1 text-base">👋 hey. i&apos;m voyle.</p>
              <p>say something. i dare you.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-[color:var(--yt-blue)] text-white rounded-br-sm"
                    : "bg-[color:var(--yt-chip)] text-[color:var(--yt-text)] rounded-bl-sm"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-[color:var(--yt-text-secondary)] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-[color:var(--yt-text-secondary)] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-[color:var(--yt-text-secondary)] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2 px-4 py-3 border-t border-[color:var(--yt-border)] bg-[color:var(--yt-surface)]"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={streaming}
            className="flex-1 h-10 px-4 border border-[color:var(--yt-border)] rounded-full bg-[color:var(--yt-bg)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] placeholder:text-[color:var(--yt-text-secondary)]"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="h-10 px-4 bg-[color:var(--yt-blue)] text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}