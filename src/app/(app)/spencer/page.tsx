"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROTATION = [
  "Sorry, no we're not watching today. Nissim, give out these sheets.",
  "STOP SMIRKING LIKE A S**** LITTLE GIRL!",
  "(Casual Nazi Salute)",
];

export default function SpencerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyIndex, setReplyIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    const reply = ROTATION[replyIndex % ROTATION.length];
    setReplyIndex((i) => i + 1);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Sticky nav with red accent */}
      <header className="sticky top-0 z-30 ios-glass">
        <div className="px-5 pt-3 pb-3 flex items-end justify-between">
          <div>
            <h1 className="ios-large-title leading-none">Spencer</h1>
            <p className="ios-subhead mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--danger)]" />
              He's got a few things to say.
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff9500] flex items-center justify-center text-white text-[16px] font-semibold shadow-sm">
            S
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-[120px]">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff9500] flex items-center justify-center text-white text-3xl font-semibold mb-4 shadow-lg">
                S
              </div>
              <h2 className="ios-title mb-1">Hey, I'm Spencer.</h2>
              <p className="ios-callout max-w-sm">
                Say something. I dare you.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="ios-fixed-bottom">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-end gap-2">
          <div className="flex-1 ios-card !rounded-[22px] px-3.5 py-1.5 flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="iMessage Spencer…"
              rows={1}
              className="w-full bg-transparent text-[17px] outline-none resize-none max-h-32 text-[var(--fg)] placeholder:text-[var(--fg-faint)]"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[var(--danger)] text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
            aria-label="Send"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex ios-spring-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-[20px] text-[16px] leading-snug whitespace-pre-wrap break-words ${
          isUser
            ? "bg-[var(--tint)] text-white rounded-br-[6px]"
            : "bg-[var(--bg-elev)] text-[var(--fg)] rounded-bl-[6px]"
        }`}
        style={{
          boxShadow: isUser
            ? "0 1px 2px rgba(0,0,0,0.08)"
            : "0 0 0 0.5px var(--border)",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}