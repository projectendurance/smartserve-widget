// src/components/BookingModal.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AvailabilityResponse,
  BookingPrefill,
  CreateBookingResponse,
} from "../lib/types";
import { checkAvailability, createBooking } from "../lib/bookingClient";

type Props = {
  open: boolean;
  onClose: () => void;

  venueId: string;
  embedKey: string;

  bookingApiBase: string;

  availabilityPath: string;   // e.g. "/api/availability"
  createBookingPath: string;  // e.g. "/api/bookings"

  prefill: BookingPrefill | null;

  onBooked: (result: CreateBookingResponse) => void;
};

function normalizePrefillTime(t?: string) {
  const s = (t || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function BookingModal({
  open,
  onClose,
  venueId,
  embedKey,
  bookingApiBase,
  availabilityPath,
  createBookingPath,
  prefill,
  onBooked,
}: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState<number>(2);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Theme tokens (from index.css)
  const css = {
    void: "var(--ss-void, #040307)",
    navy1: "var(--ss-navy-1, #000010)",
    navy2: "var(--ss-navy-2, #000818)",
    text: "var(--ss-text, rgba(255,255,255,0.92))",
    muted: "var(--ss-muted, rgba(255,255,255,0.65))",
    border: "var(--ss-border, rgba(255,255,255,0.10))",
    orange: "var(--ss-orange, #F84400)",
    orange2: "var(--ss-orange-2, #F85800)",
    orangeSoft: "var(--ss-orange-soft, rgba(248,68,0,0.25))",
    orangeRing: "var(--ss-orange-ring, rgba(248,68,0,0.38))",
    font:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
  };

  // Apply prefill whenever it changes (server-driven)
  useEffect(() => {
    if (!open) return;
    if (!prefill) return;

    if (typeof prefill.party_size === "number") setPartySize(prefill.party_size);
    if (prefill.date) setDate(prefill.date);
    if (prefill.time) setTime(normalizePrefillTime(prefill.time));
    if (prefill.name) setName(prefill.name);
    if (prefill.contact) setContact(prefill.contact);
    if (prefill.special_requests) setNotes(prefill.special_requests);

    setErr(null);
    setAvailability(null);
  }, [prefill, open]);

  useEffect(() => {
    if (!open) {
      setErr(null);
      setAvailability(null);
      setBusy(false);
      setChecking(false);
      return;
    }

    // focus first field on open (professional polish)
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  // basic esc close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const missing = useMemo(() => {
    const out: string[] = [];
    if (!name.trim()) out.push("name");
    if (!date) out.push("date");
    if (!time) out.push("time");
    if (!partySize || partySize < 1) out.push("party size");
    return out;
  }, [name, date, time, partySize]);

  async function onCheckAvailability() {
    setErr(null);
    setAvailability(null);

    if (!date || !partySize || partySize < 1) {
      setErr("Enter date + party size first.");
      return;
    }

    setChecking(true);
    try {
      const res = await checkAvailability(
        bookingApiBase,
        venueId,
        embedKey,
        {
          venue_id: venueId,
          date,
          party_size: partySize,
          time_24h: time ? time : null,
        },
        availabilityPath
      );
      setAvailability(res);
    } catch (e: any) {
      setErr(String(e?.message || "Availability check failed."));
    } finally {
      setChecking(false);
    }
  }

  async function onConfirm() {
    setErr(null);

    if (missing.length) {
      setErr(`Missing: ${missing.join(", ")}.`);
      return;
    }

    setBusy(true);
    try {
      const result = await createBooking(
        bookingApiBase,
        venueId,
        embedKey,
        {
          venue_id: venueId,
          date,
          time_24h: time,
          party_size: partySize,
          name: name.trim(),
          contact: contact.trim() || "",
          special_requests: notes.trim() || "",
        },
        createBookingPath
      );

      onBooked(result);
      onClose();
    } catch (e: any) {
      setErr(String(e?.message || "Booking failed."));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const panelBg = `
    radial-gradient(900px 520px at 50% 0%, rgba(248,68,0,0.10), transparent 58%),
    radial-gradient(700px 520px at 50% 90%, rgba(0,8,24,0.95), transparent 60%),
    linear-gradient(180deg, ${css.navy1}, ${css.void})
  `;

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: css.muted,
    letterSpacing: 0.2,
    fontFamily: css.font,
    marginBottom: 6,
    display: "block",
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.22)",
    color: css.text,
    outline: "none",
    fontFamily: css.font,
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.12)",
    transition: "box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
  };

  // Professional focus ring (thin orange, not tacky)
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = String(css.orangeRing);
      e.currentTarget.style.boxShadow = `0 0 0 3px ${css.orangeSoft}`;
      e.currentTarget.style.filter = "brightness(1.03)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.filter = "none";
    },
  } as const;

  // Date/Time icon overlay (clean, subtle)
  const iconWrap: React.CSSProperties = {
    position: "relative",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    opacity: 0.75,
    pointerEvents: "none",
  };

  const padRightForIcon: React.CSSProperties = {
    paddingRight: 36,
  };

  const fieldBorder = (key: string) =>
    missing.includes(key)
      ? `1px solid ${css.orangeRing}`
      : "1px solid rgba(255,255,255,0.12)";

  const IconCalendar = () => (
    <svg viewBox="0 0 24 24" style={iconStyle} fill="none">
      <path
        d="M7 2v3M17 2v3M3.5 9.5h17"
        stroke={css.orange}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M6 5h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <path
        d="M7.5 13h3M7.5 16.5h3M13.5 13h3M13.5 16.5h3"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );

  const IconClock = () => (
    <svg viewBox="0 0 24 24" style={iconStyle} fill="none">
      <path
        d="M12 7v5l3 2"
        stroke={css.orange}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        opacity="0.9"
      />
    </svg>
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 10,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 390,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${css.border}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
          background: panelBg,
          backdropFilter: "blur(10px)",
          fontFamily: css.font,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                color: css.text,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 0.2,
              }}
            >
              Book a table
            </div>
            <div style={{ color: css.muted, fontSize: 11 }}>
              Fill the details below to confirm.
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close booking form"
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

        {/* Body */}
        <div style={{ padding: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label style={labelStyle}>Date</label>
              <div style={iconWrap}>
                <input
                  ref={firstFieldRef}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ ...inputBase, ...padRightForIcon, border: fieldBorder("date") }}
                  {...focusHandlers}
                />
                <IconCalendar />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Time</label>
              <div style={iconWrap}>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ ...inputBase, ...padRightForIcon, border: fieldBorder("time") }}
                  {...focusHandlers}
                />
                <IconClock />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Party size</label>
              <input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                style={{ ...inputBase, border: fieldBorder("party size") }}
                {...focusHandlers}
              />
            </div>

            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{ ...inputBase, border: fieldBorder("name") }}
                {...focusHandlers}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Contact (optional)</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email or phone"
                style={{ ...inputBase, border: "1px solid rgba(255,255,255,0.12)" }}
                {...focusHandlers}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Special requests (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Allergies, seating, etc."
                style={{
                  ...inputBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  resize: "none",
                }}
                {...focusHandlers}
              />
            </div>
          </div>

          {/* Error */}
          {err && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(248,68,0,0.35)",
                background: "rgba(248,68,0,0.10)",
                color: css.text,
                fontSize: 12,
              }}
            >
              {err}
            </div>
          )}

          {/* Availability */}
          {availability?.slots?.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: css.muted, marginBottom: 8 }}>
                Suggested times
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availability.slots
                  .filter((s) => s.available)
                  .slice(0, 10)
                  .map((s) => {
                    const active = s.time_24h === time;
                    return (
                      <button
                        key={s.time_24h}
                        onClick={() => setTime(s.time_24h)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: active
                            ? "1px solid rgba(248,68,0,0.55)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: active
                            ? "linear-gradient(90deg, rgba(248,68,0,0.22), rgba(248,88,0,0.14))"
                            : "rgba(255,255,255,0.06)",
                          color: css.text,
                          cursor: "pointer",
                          fontSize: 12,
                          fontFamily: css.font,
                        }}
                        title="Use this time"
                      >
                        {s.time_24h}
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              onClick={onCheckAvailability}
              disabled={checking || busy}
              style={{
                flex: 1,
                padding: "11px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: css.text,
                cursor: checking || busy ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontFamily: css.font,
              }}
            >
              {checking ? "Checking..." : "Check"}
            </button>

            <button
              onClick={onConfirm}
              disabled={busy}
              style={{
                flex: 1,
                padding: "11px 12px",
                borderRadius: 14,
                border: "0",
                background: busy
                  ? "rgba(255,255,255,0.08)"
                  : `linear-gradient(90deg, ${css.orange}, ${css.orange2})`,
                color: busy ? css.muted : "#0b0b0b",
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 900,
                fontFamily: css.font,
                boxShadow: busy ? "none" : "0 16px 35px rgba(248,68,0,0.22)",
              }}
            >
              {busy ? "Booking..." : "Confirm"}
            </button>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 12, fontSize: 11, color: css.muted }}>
            This creates a real booking for venue:{" "}
            <code style={{ color: css.text }}>{venueId}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
