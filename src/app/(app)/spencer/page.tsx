"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROTATION = [
  "Sorry, no we're not watching today. Nissim, give out these sheets.",
  "STOP SMIRKING LIKE A S**** LITTLE GIRL!",
  "(Casual Nazi Salute)",
];

/* /spencer — a YouTube-style chat panel matching the Voyle chat layout.
 * Returns a rotating automated reply to every prompt. */
export default function SpencerClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyIndex, setReplyIndex] = useState(0);
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
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate a brief delay then return the next rotated reply
    const reply = ROTATION[replyIndex % ROTATION.length];
    setReplyIndex((i) => i + 1);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }, 600);
  }

  return (
    <div className="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Chat to Spencer</h1>
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
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-medium text-sm">Spencer</span>
          <span className="text-xs text-[color:var(--yt-text-secondary)]">
            — automated replies
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[color:var(--yt-bg)]">
          {messages.length === 0 && (
            <div className="text-center text-[color:var(--yt-text-secondary)] text-sm py-12">
              <p className="mb-1 text-base">👋 hey. i&apos;m spencer.</p>
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
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[color:var(--yt-blue)] text-white rounded-br-sm"
                    : "bg-[color:var(--yt-chip)] text-[color:var(--yt-text)] rounded-bl-sm"
                }`}
              >
                {msg.content}
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
            className="flex-1 h-10 px-4 border border-[color:var(--yt-border)] rounded-full bg-[color:var(--yt-bg)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] placeholder:text-[color:var(--yt-text-secondary)]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-10 px-4 bg-red-600 text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}