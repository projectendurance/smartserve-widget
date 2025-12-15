import { useMemo, useRef, useState } from "react";
import { chatSend } from "./api";

type Props = { venueId: string; embedKey: string; apiBase: string };
type Msg = { role: "user" | "assistant"; text: string };

function getSessionId() {
  const k = "ss_widget_session_id";
  const existing = sessionStorage.getItem(k);
  if (existing) return existing;
  const v = crypto.randomUUID();
  sessionStorage.setItem(k, v);
  return v;
}

export default function Widget({ venueId, embedKey, apiBase }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hi — how can I help?" },
  ]);

  const sessionIdRef = useRef<string>(getSessionId());

  const title = useMemo(
    () => `venue=${venueId} key=${embedKey.slice(0, 8)}… api=${apiBase}`,
    [venueId, embedKey, apiBase]
  );

  async function onSend() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      const res = await chatSend(apiBase, venueId, embedKey, {
        message: text,
        session_id: sessionIdRef.current,
      });

      setMsgs((m) => [...m, { role: "assistant", text: res.text }]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error sending message. ${e?.message || ""}`.trim(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <div
          style={{
            width: 340,
            height: 440,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            overflow: "hidden",
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
              fontSize: 14,
            }}
          >
            <strong>SmartServe Assistant</strong>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
              }}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: m.role === "user" ? "#111" : "#f2f2f2",
                    color: m.role === "user" ? "white" : "black",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 10, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
              placeholder={busy ? "Sending..." : "Type a message…"}
              style={{
                flex: 1,
                padding: "10px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                fontSize: 13,
              }}
              disabled={busy}
            />
            <button
              onClick={onSend}
              disabled={busy}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: busy ? "#f5f5f5" : "white",
                cursor: busy ? "not-allowed" : "pointer",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
              }}
              title={title}
            >
              Send
            </button>
          </div>

          <div style={{ padding: 8, borderTop: "1px solid #eee", fontSize: 11, opacity: 0.65 }}>
            {title}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title={title}
        style={{
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "white",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        Chat Assistant • Powered by SmartServe AI
      </button>
    </div>
  );
}
