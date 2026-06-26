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

    // Simulate a brief delay then return the next rotated reply
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
    <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#ea4335] rounded-full flex items-center justify-center text-white font-medium">
          S
        </div>
        <div>
          <h1 className="text-xl font-medium text-[#202124]">Chat to Spencer</h1>
          <p className="text-sm text-[#5f6368]">
            He&apos;s got a few things to say.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-[#5f6368] py-16">
            <div className="w-16 h-16 bg-[#ea4335] rounded-full flex items-center justify-center text-white text-2xl font-medium mx-auto mb-4">
              S
            </div>
            <p className="text-lg font-medium text-[#202124] mb-1">
              👋 hey. i&apos;m spencer.
            </p>
            <p className="text-sm">say something. i dare you.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#1a73e8] text-white rounded-br-sm"
                  : "bg-[#f1f3f4] text-[#202124] rounded-bl-sm"
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
        className="flex items-end gap-2 pt-4 border-t border-[#e0e0e0]"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type something..."
          rows={1}
          className="flex-1 bg-[#f1f3f4] text-[#202124] text-sm px-4 py-3 rounded-2xl border border-transparent focus:outline-none focus:border-[#1a73e8] transition-colors placeholder:text-[#5f6368] resize-none max-h-32"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-[#ea4335] text-white p-3 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d33b2a] transition-colors"
          aria-label="Send"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
    </main>
  );
}