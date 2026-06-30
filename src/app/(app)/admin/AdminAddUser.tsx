"use client";

import { useState } from "react";
import { Shield, UserPlus, Check, AlertCircle } from "lucide-react";

export default function AdminAddUser() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() }),
      });

      const data: { message?: string; error?: string } = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Email submitted for approval.");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--yt-text)] mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newuser@example.com"
            required
            className="w-full px-3 py-2 bg-transparent border border-[color:var(--yt-border)] rounded-lg text-[color:var(--yt-text)] text-sm focus:outline-none focus:border-[color:var(--yt-brand)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[color:var(--yt-text)] mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New User"
            required
            className="w-full px-3 py-2 bg-transparent border border-[color:var(--yt-border)] rounded-lg text-[color:var(--yt-text)] text-sm focus:outline-none focus:border-[color:var(--yt-brand)] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !email || !name}
          className="flex items-center gap-2 px-4 py-2 bg-[color:var(--yt-brand)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          {status === "loading" ? "Submitting…" : "Submit for approval"}
        </button>
      </form>

      {status === "success" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-400 font-medium">{message}</p>
            <p className="text-xs text-[color:var(--yt-text-secondary)] mt-1">
              To activate this user, go to the Supabase Table Editor → users
              table → set <code className="px-1 py-0.5 rounded bg-[color:var(--yt-hover)]">allowed</code> to true.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{message}</p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-[color:var(--yt-hover)]">
        <Shield className="w-5 h-5 text-[color:var(--yt-text-secondary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[color:var(--yt-text-secondary)]">
          Submitted emails are saved with <strong>allowed = false</strong>. They
          cannot sign in until a real admin approves them in Supabase.
        </p>
      </div>
    </div>
  );
}