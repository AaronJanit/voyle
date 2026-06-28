"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    if (open) inputRef.current?.focus();
  }, [open]);

  // Don't render on login / dedicated chat pages (hooks above must run first)
  if (pathname === "/login" || pathname === "/chat" || pathname === "/spencer") return null;

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
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId,
        }),
      });

      const convId = res.headers.get("X-Conversation-Id");
      if (convId) setConversationId(convId);

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "Something went wrong");
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
    <>
      {/* Floating action button — iOS-style circle */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(10,132,255,0.4)] active:scale-95 transition"
          aria-label="Open chat"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"
            />
          </svg>
        </button>
      )}

      {/* Chat sheet — iOS modal style */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--bg-elev)] w-full sm:w-[400px] h-[90vh] sm:h-[640px] sm:max-h-[85vh] sm:rounded-[22px] rounded-t-[22px] flex flex-col overflow-hidden shadow-2xl ios-spring-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2">
              <div className="w-9 h-1 rounded-full bg-[var(--border-strong)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] flex items-center justify-center text-white text-[14px] font-semibold shadow-sm">
                  V
                </div>
                <div>
                  <div className="ios-headline leading-tight">Voyle</div>
                  <div className="ios-caption leading-tight flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                    Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg)] text-[var(--fg-muted)] flex items-center justify-center"
                aria-label="Close chat"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M6 6l12 12M6 18L18 6"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] flex items-center justify-center text-white text-2xl font-semibold mb-3 shadow-lg">
                    V
                  </div>
                  <p className="ios-headline mb-1">Hey, I'm Voyle.</p>
                  <p className="ios-subhead max-w-xs">
                    Your AI host. Say something — I dare you.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--border)]"
            >
              <div className="flex-1 bg-[var(--bg)] rounded-[20px] px-3.5 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="iMessage Voyle…"
                  disabled={streaming}
                  className="w-full bg-transparent text-[16px] outline-none text-[var(--fg)] placeholder:text-[var(--fg-faint)]"
                />
              </div>
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="w-9 h-9 rounded-full bg-[var(--tint)] text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
                aria-label="Send"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex ios-spring-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] px-3.5 py-2 rounded-[18px] text-[15px] leading-snug whitespace-pre-wrap break-words ${
          isUser
            ? "bg-[var(--tint)] text-white rounded-br-[5px]"
            : "bg-[var(--bg)] text-[var(--fg)] rounded-bl-[5px]"
        }`}
      >
        {msg.content || (
          <span className="ios-dot-loader">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </div>
  );
}