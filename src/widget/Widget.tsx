import { useMemo, useRef, useState, useEffect } from "react";
import { chatSend } from "./api";
import BookingModal from "../components/BookingModal";
import type { BookingPrefill, ChatResponse } from "../lib/types";

type Props = {
  venueId: string;
  embedKey: string;
  apiBase: string; // chat service base
  bookingApiBase: string; // booking-api base
  availabilityPath?: string; // default "/api/check_availability"
  createBookingPath?: string; // default "/api/create_booking"
};

type Msg = { role: "user" | "assistant"; text: string };
const MAX_MESSAGE_LEN = 2000;

function getSessionId() {
  const k = "ss_widget_session_id";
  const existing = sessionStorage.getItem(k);
  if (existing) return existing;
  const v = crypto.randomUUID();
  sessionStorage.setItem(k, v);
  return v;
}

export default function Widget({
  venueId,
  embedKey,
  apiBase,
  bookingApiBase,
  availabilityPath,
  createBookingPath,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hi — how can I help?" },
  ]);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(
    null
  );

  function openBookingForm(prefill?: BookingPrefill) {
    setBookingPrefill(prefill ?? null);
    setBookingOpen(true);
  }

  const sessionIdRef = useRef<string>(getSessionId());
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(
    () => `venue=${venueId} key=${embedKey.slice(0, 8)}… api=${apiBase}`,
    [venueId, embedKey, apiBase]
  );

  // auto-scroll to latest
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  // focus input when opened
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  async function onSend() {
    if (busy) return;
    if (typeof input !== "string") return;

    const text = input.trim();
    if (!text) return;

    if (text.length > MAX_MESSAGE_LEN) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Message too long. Please shorten it." },
      ]);
      return;
    }

    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      const res = await chatSend(apiBase, venueId, embedKey, {
        message: text,
        session_id: sessionIdRef.current,
      });

      const raw = (res as any)?.raw as ChatResponse;
      const reply = String((res as any)?.text ?? "").trim();

      if (reply) setMsgs((m) => [...m, { role: "assistant", text: reply }]);

      if (raw?.action?.type === "OPEN_BOOKING_FORM") {
        openBookingForm(raw.action.prefill);
      }
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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  // Theme tokens (falls back if CSS vars not present)
  const css = {
    void: "var(--ss-void, #040307)",
    navy1: "var(--ss-navy-1, #000010)",
    navy2: "var(--ss-navy-2, #000818)",
    border: "var(--ss-border, rgba(255,255,255,0.10))",
    text: "var(--ss-text, rgba(255,255,255,0.92))",
    muted: "var(--ss-muted, rgba(255,255,255,0.65))",
    orange: "var(--ss-orange, #F84400)",
    orange2: "var(--ss-orange-2, #F85800)",
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 2147483647 }}>
      {/* Panel */}
      {open && (
        <div
          style={{
            width: 360,
            height: 520,
            borderRadius: 22,
            overflow: "hidden",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            border: `1px solid ${css.border}`,
            boxShadow: "0 30px 90px rgba(0,0,0,0.70)",
            background: `
              radial-gradient(900px 500px at 50% 10%, rgba(248,68,0,0.12), transparent 55%),
              radial-gradient(700px 520px at 50% 75%, rgba(0,8,24,0.95), transparent 60%),
              linear-gradient(180deg, ${css.navy1}, ${css.void})
            `,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${css.border}`,
              background: "rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Clean orange status dot (no black-hole icon) */}
              <div
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: css.orange,
                  boxShadow: "0 0 0 4px rgba(248,68,0,0.12)",
                  flex: "0 0 auto",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontFamily:
                      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    color: css.text,
                    lineHeight: 1.1,
                  }}
                >
                  SmartServe Assistant
                </div>
                <div
                  style={{
                    fontFamily:
                      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                    fontSize: 11,
                    color: css.muted,
                    lineHeight: 1.2,
                  }}
                >
                  Fast answers • Booking when needed
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close"
              style={{
                border: `1px solid ${css.border}`,
                background: "rgba(255,255,255,0.04)",
                color: css.text,
                width: 34,
                height: 34,
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            style={{
              padding: 14,
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {msgs.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      padding: "10px 12px",
                      borderRadius: 16,
                      border: `1px solid ${
                        isUser ? "rgba(248,68,0,0.35)" : "rgba(255,255,255,0.10)"
                      }`,
                      background: isUser
                        ? "linear-gradient(90deg, rgba(248,68,0,0.22), rgba(248,88,0,0.14))"
                        : "rgba(255,255,255,0.06)",
                      color: css.text,
                      fontFamily:
                        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                      fontSize: 13,
                      lineHeight: 1.4,
                      whiteSpace: "pre-wrap",
                      boxShadow: isUser
                        ? "0 14px 30px rgba(248,68,0,0.12)"
                        : "none",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {busy && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.06)",
                    color: css.muted,
                    fontFamily:
                      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ opacity: 0.9 }}>Typing</span>
                  <span className="ss-typing" aria-label="Assistant typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Safety disclaimer */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: `1px solid ${css.border}`,
              fontSize: 11,
              lineHeight: 1.35,
              color: css.muted,
              background: "rgba(0,0,0,0.16)",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
            }}
          >
            Allergy / intolerance note: dish descriptions may change. For allergen or
            ingredient-safety information, please contact the restaurant directly.
          </div>

          {/* Booking Modal (server-driven) */}
          <BookingModal
            open={bookingOpen}
            onClose={() => setBookingOpen(false)}
            venueId={venueId}
            embedKey={embedKey}
            bookingApiBase={bookingApiBase}
            availabilityPath={availabilityPath ?? "/api/check_availability"}
            createBookingPath={createBookingPath ?? "/api/create_booking"}
            prefill={bookingPrefill}
            onBooked={(result) => {
              const code = result?.confirmation_code || "N/A";
              const manage = result?.manage_url ? `\nManage: ${result.manage_url}` : "";

              if (result?.status === "requires_payment" && result?.checkout_url) {
                setMsgs((m) => [
                  ...m,
                  {
                    role: "assistant",
                    text: `Deposit required to confirm.\nPay here: ${result.checkout_url}`,
                  },
                ]);
                return;
              }

              setMsgs((m) => [
                ...m,
                { role: "assistant", text: `Booked. Confirmation code: ${code}.${manage}` },
              ]);
            }}
          />

          {/* Input row */}
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${css.border}`,
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={busy ? "Sending..." : "Type a message…"}
              style={{
                flex: 1,
                padding: "11px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.22)",
                color: css.text,
                outline: "none",
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                fontSize: 13,
              }}
              disabled={busy}
            />

            <button
              onClick={onSend}
              disabled={busy}
              title={title}
              style={{
                padding: "11px 14px",
                borderRadius: 14,
                border: "0",
                background: busy
                  ? "rgba(255,255,255,0.08)"
                  : `linear-gradient(90deg, ${css.orange}, ${css.orange2})`,
                color: busy ? css.muted : "#0b0b0b",
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
                boxShadow: busy ? "none" : "0 16px 35px rgba(248,68,0,0.22)",
              }}
            >
              Send
            </button>
          </div>

          {/* Debug footer (optional) */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: `1px solid ${css.border}`,
              fontSize: 11,
              color: css.muted,
              opacity: 0.85,
              background: "rgba(0,0,0,0.14)",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* Launcher button (navy background + orange text, no icon) */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={title}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: "1px solid rgba(248,68,0,0.35)",
          background: `linear-gradient(180deg, ${css.navy1}, ${css.void})`,
          color: css.orange,
          cursor: "pointer",
          boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
          maxWidth: 360,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.15 }}>
            Chat Assistant
          </div>
          <div style={{ fontSize: 11, color: "rgba(248,68,0,0.75)", lineHeight: 1.15 }}>
            Powered by SmartServe AI
          </div>
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(248,68,0,0.75)" }}>
          {open ? "Close" : "Open"}
        </div>
      </button>
    </div>
  );
}
