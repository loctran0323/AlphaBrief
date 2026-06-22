"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

type Message = {
  id: string;
  user: string;
  email: string;
  text: string;
  ts: number;
};

const AVATAR_COLORS = [
  "#6C5CE7","#0284C7","#059669","#D97706","#DC2626","#7C3AED","#0891B2","#65A30D",
];

function avatarColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

function Avatar({ email, size = 26 }: { email: string; size?: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, flexShrink: 0,
      background: avatarColor(email),
      fontFamily: SANS_L, fontSize: size * 0.42, fontWeight: 700, color: "#fff",
      userSelect: "none",
    }}>
      {email[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

const MAX_MESSAGES = 120;
const CHANNEL = "alphabrief-global-chat-v1";

export function ChatRoom({
  email,
}: {
  email: string | null;
}) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [online, setOnline]       = useState(0);
  const [connected, setConnected] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase   = useRef(createClient());

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
        setOnline(Object.keys(channel.presenceState()).length);
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
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !email || !channelRef.current) return;
    setInput("");
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      user: email.split("@")[0]!,
      email, text,
      ts: Date.now(),
    };
    await channelRef.current.send({ type: "broadcast", event: "msg", payload: msg });
  }, [input, email]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  const unread = !open && messages.length > 0 ? messages.length : 0;

  return (
    <>
      {/* ── Toggle tab — fixed right edge ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close community chat" : "Open community chat"}
        style={{
          position: "fixed",
          right: open ? 340 : 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 51,
          background: "var(--ab-card)",
          border: "1px solid var(--ab-border)",
          borderRight: open ? "none" : undefined,
          padding: "14px 7px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          transition: "right .2s ease",
        }}
      >
        <span style={{
          display: "inline-block",
          width: 6, height: 6, borderRadius: "50%",
          background: connected ? "#10B981" : "#F59E0B",
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: SANS_L, fontSize: 9, fontWeight: 700,
          letterSpacing: ".16em", textTransform: "uppercase",
          color: "var(--ab-muted)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          whiteSpace: "nowrap",
        }}>
          {open ? "Close" : "Chat"}
          {!open && online > 0 && ` · ${online}`}
        </span>
        {unread > 0 && !open && (
          <span style={{
            width: 14, height: 14, borderRadius: "50%",
            background: ACCENT, color: "#fff",
            fontFamily: SANS_L, fontSize: 8, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* ── Sidebar panel ── */}
      <div
        style={{
          position: "fixed",
          right: open ? 0 : -340,
          top: 0,
          bottom: 0,
          width: 340,
          background: "var(--ab-card)",
          borderLeft: "1px solid var(--ab-border)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transition: "right .2s ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Panel header */}
        <div style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--ab-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
              letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ab-muted)",
            }}>Community chat</span>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: connected ? "#10B981" : "#F59E0B",
              display: "inline-block",
            }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {online > 0 && (
              <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)" }}>
                {online} online
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: SANS_L, fontSize: 18, color: "var(--ab-faint)",
                lineHeight: 1, padding: "0 2px",
              }}
              aria-label="Close chat"
            >×</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 16,
          display: "flex", flexDirection: "column", gap: 16,
          scrollbarWidth: "thin",
        }}>
          {messages.length === 0 ? (
            <p style={{
              margin: "auto 0",
              fontFamily: SERIF_L, fontStyle: "italic",
              fontSize: 13, color: "var(--ab-faint)", textAlign: "center",
            }}>
              {email ? "No messages yet. Say hello 👋" : "Sign in to join the chat."}
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Avatar email={m.email} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: SANS_L, fontSize: 11, fontWeight: 700, color: "var(--ab-fg)" }}>
                      {m.user}
                    </span>
                    <span style={{ fontFamily: SANS_L, fontSize: 10, color: "var(--ab-faint)" }}>
                      {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: SERIF_L, fontSize: 14, lineHeight: 1.55,
                    color: "var(--ab-muted)", marginTop: 2, wordBreak: "break-word",
                  }}>
                    {m.text}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          borderTop: "1px solid var(--ab-border)", padding: 12, flexShrink: 0,
        }}>
          {email ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar email={email} size={22} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                maxLength={500}
                placeholder="Message the room…"
                style={{
                  flex: 1,
                  fontFamily: SERIF_L, fontSize: 14, color: "var(--ab-fg)",
                  background: "transparent", border: "none",
                  borderBottom: "1px solid var(--ab-border)",
                  padding: "4px 0", outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim()}
                style={{
                  fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
                  letterSpacing: ".1em", textTransform: "uppercase",
                  color: "#fff", background: ACCENT, border: "none",
                  padding: "5px 10px", cursor: "pointer",
                  opacity: input.trim() ? 1 : 0.4,
                  flexShrink: 0,
                }}
              >Send</button>
            </div>
          ) : (
            <p style={{
              textAlign: "center",
              fontFamily: SERIF_L, fontStyle: "italic",
              fontSize: 13, color: "var(--ab-faint)",
            }}>
              <a href="/login" style={{ color: ACCENT, textDecoration: "none" }}>Sign in</a>
              {" "}to join the conversation.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
