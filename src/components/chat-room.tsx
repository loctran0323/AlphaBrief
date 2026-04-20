"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  user: string;
  email: string;
  isPro: boolean;
  text: string;
  ts: number;
};

function colorFromEmail(email: string): string {
  const colors = [
    "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-cyan-500",
    "bg-teal-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

function Avatar({ email }: { email: string }) {
  const initial = email[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${colorFromEmail(email)}`}
    >
      {initial}
    </span>
  );
}

const MAX_MESSAGES = 120;
const CHANNEL = "alphabrief-global-chat-v1";

export function ChatRoom({
  email,
  isPro = false,
}: {
  email: string | null;
  isPro?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = useRef(createClient());

  useEffect(() => {
    const channel = supabase.current
      .channel(CHANNEL, { config: { broadcast: { self: true }, presence: { key: email ?? "anon" } } })
      .on("broadcast", { event: "msg" }, ({ payload }: { payload: Message }) => {
        setMessages((prev) => {
          const next = [...prev, payload];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          if (email) await channel.track({ email, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    const sb = supabase.current;
    return () => { void sb.removeChannel(channel); };
  }, [email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !email || !channelRef.current) return;
    setInput("");
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      user: email.split("@")[0]!,
      email,
      isPro,
      text,
      ts: Date.now(),
    };
    await channelRef.current.send({ type: "broadcast", event: "msg", payload: msg });
  }, [input, email, isPro]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">Community chat</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`}
          />
        </div>
        {online > 0 && (
          <span className="text-xs text-[var(--faint)]">
            {online} online
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex h-72 flex-col gap-3 overflow-y-auto p-4 [scrollbar-width:thin]">
        {messages.length === 0 ? (
          <p className="m-auto text-xs text-[var(--faint)]">
            {email ? "No messages yet — say hello 👋" : "Sign in to join the chat."}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <Avatar email={m.email} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--foreground)]">{m.user}</span>
                  {m.isPro && (
                    <span className="rounded-full bg-[#EDE9FE] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#6C5CE7]">
                      Pro
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--faint)]">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-0.5 break-words text-sm leading-relaxed text-[var(--muted)]">{m.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3">
        {email ? (
          <div className="flex items-center gap-2">
            <Avatar email={email} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={500}
              placeholder="Message the room…"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--faint)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim()}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--faint)]">
            <a href="/login" className="font-medium text-[var(--accent)] hover:underline">Sign in</a>{" "}
            to join the conversation.
          </p>
        )}
      </div>
    </div>
  );
}
