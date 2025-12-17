// src/components/BookingModal.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
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

  availabilityPath: string; // e.g. "/api/availability"
  createBookingPath: string; // e.g. "/api/bookings"

  prefill: BookingPrefill | null;

  onBooked: (result: CreateBookingResponse) => void;
};

type Step = 1 | 2 | 3;

function normalizePrefillTime(t?: string) {
  const s = (t || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
}

function uniqueAvailableSlots(res: AvailabilityResponse | null) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of res?.slots || []) {
    if (!s?.available) continue;
    const t = String((s as any).time_24h ?? "").trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
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
  // Step flow
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState<number>(2);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);

  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Theme tokens
  const css = {
    void: "var(--ss-void, #040307)",
    navy1: "var(--ss-navy-1, #000010)",
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
    boxSizing: "border-box",
    height: 40,
    padding: "9px 10px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.22)",
    color: css.text,
    outline: "none",
    fontFamily: css.font,
    fontSize: 12.5,
    lineHeight: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    transition:
      "box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
  };

  const textareaBase: React.CSSProperties = {
    ...inputBase,
    height: "auto",
    minHeight: 64,
    paddingTop: 10,
    paddingBottom: 10,
    resize: "none",
  };

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

  // Prefill
  useEffect(() => {
    if (!open) return;

    // Reset per-open UI state
    setErr(null);
    setBusy(false);
    setChecking(false);

    if (!prefill) {
      // keep user values if re-opened; just keep step sane
      setStep(1);
      setAvailability(null);
      return;
    }

    if (typeof prefill.party_size === "number") setPartySize(prefill.party_size);
    if (prefill.date) setDate(prefill.date);

    if (prefill.time) {
      const t = normalizePrefillTime(prefill.time);
      setTime(t);
    }

    if (prefill.name) setName(prefill.name);
    if (prefill.contact) setContact(prefill.contact);
    if (prefill.special_requests) setNotes(prefill.special_requests);

    // Step jump logic
    const hasDate = Boolean(prefill.date);
    const hasParty = typeof prefill.party_size === "number" && prefill.party_size > 0;
    const hasTime = Boolean(prefill.time);
    const hasName = Boolean(prefill.name);

    if (hasDate && hasParty && hasTime) {
      setStep(hasName ? 3 : 3);
    } else {
      setStep(1);
    }

    setAvailability(null);
  }, [prefill, open]);

  // Focus first field on open / step change
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, step]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const availableTimes = useMemo(
    () => uniqueAvailableSlots(availability).slice(0, 24),
    [availability]
  );

  // Validation per-step
  const missingForConfirm = useMemo(() => {
    const out: string[] = [];
    if (!name.trim()) out.push("name");
    if (!date) out.push("date");
    if (!time) out.push("time");
    if (!partySize || partySize < 1) out.push("party size");
    return out;
  }, [name, date, time, partySize]);

  const canSeeTimes = Boolean(date) && partySize >= 1 && !checking && !busy;
  const canContinueFromTimes = Boolean(time) && !checking && !busy;
  const canConfirm = missingForConfirm.length === 0 && !busy;

  async function onSeeTimes() {
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
          time_24h: null, // IMPORTANT: step 2 is where time is chosen
        },
        availabilityPath
      );
      setAvailability(res);

      const times = uniqueAvailableSlots(res);
      if (times.length) {
        // if current time isn't in suggestions, clear it
        if (time && !times.includes(time)) setTime("");
        setStep(2);
      } else {
        setErr("No availability returned for that date/party size.");
      }
    } catch (e: any) {
      setErr(String(e?.message || "Availability check failed."));
    } finally {
      setChecking(false);
    }
  }

  async function onConfirm() {
    setErr(null);

    if (missingForConfirm.length) {
      setErr(`Missing: ${missingForConfirm.join(", ")}.`);
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

  function StepPills() {
    const pill = (n: Step, label: string) => {
      const active = step === n;
      const done = step > n;
      return (
        <div
          key={n}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: active || done
              ? "1px solid rgba(248,68,0,0.40)"
              : "1px solid rgba(255,255,255,0.12)",
            background: active
              ? "linear-gradient(90deg, rgba(248,68,0,0.18), rgba(248,88,0,0.10))"
              : "rgba(255,255,255,0.06)",
            color: css.text,
            fontSize: 11,
            fontFamily: css.font,
            fontWeight: active ? 900 : 700,
            opacity: done ? 0.95 : 1,
            userSelect: "none",
          }}
        >
          {label}
        </div>
      );
    };

    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {pill(1, "1. When")}
        {pill(2, "2. Time")}
        {pill(3, "3. Details")}
      </div>
    );
  }

  if (!open) return null;

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
          maxWidth: 360,
          maxHeight: 460,
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${css.border}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
          background: panelBg,
          backdropFilter: "blur(10px)",
          fontFamily: css.font,
          display: "flex",
          flexDirection: "column",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
            <StepPills />
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
              flex: "0 0 auto",
            }}
          >
            ×
          </button>
        </div>

        {/* Body (scroll) */}
        <div
          style={{
            padding: 12,
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 10, fontSize: 12, color: css.muted }}>
                Choose date + party size. Then we’ll show available times.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    ref={firstFieldRef}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ ...inputBase }}
                    {...focusHandlers}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Party size</label>
                  <input
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    style={{ ...inputBase }}
                    {...focusHandlers}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 12, color: css.muted }}>
                  Pick an available time.
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={checking || busy}
                  style={{
                    marginLeft: "auto",
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: css.text,
                    cursor: checking || busy ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontFamily: css.font,
                    fontWeight: 800,
                  }}
                >
                  Back
                </button>
              </div>

              {availableTimes.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                  }}
                >
                  {availableTimes.map((t) => {
                    const active = t === time;
                    return (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        style={{
                          padding: "10px 10px",
                          borderRadius: 12,
                          border: active
                            ? "1px solid rgba(248,68,0,0.55)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: active
                            ? "linear-gradient(90deg, rgba(248,68,0,0.22), rgba(248,88,0,0.14))"
                            : "rgba(255,255,255,0.06)",
                          color: css.text,
                          cursor: "pointer",
                          fontSize: 12.5,
                          fontFamily: css.font,
                          fontWeight: active ? 900 : 800,
                          textAlign: "center",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: css.muted }}>
                  No times to show. Go back and try a different date/party size.
                </div>
              )}
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 12, color: css.muted }}>
                  Enter your details to confirm.
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={checking || busy}
                  style={{
                    marginLeft: "auto",
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: css.text,
                    cursor: checking || busy ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontFamily: css.font,
                    fontWeight: 800,
                  }}
                >
                  Back
                </button>
              </div>

              {/* Summary row */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: css.text,
                    fontSize: 11.5,
                    fontFamily: css.font,
                    fontWeight: 800,
                  }}
                >
                  {date || "—"} • {time || "—"} • {partySize}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Name</label>
                  <input
                    ref={firstFieldRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{ ...inputBase }}
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
                    style={{ ...inputBase }}
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
                    style={textareaBase}
                    {...focusHandlers}
                  />
                </div>
              </div>
            </>
          )}

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
        </div>

        {/* Actions (sticky footer) */}
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${css.border}`,
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {step === 1 && (
              <>
                <button
                  onClick={onSeeTimes}
                  disabled={!canSeeTimes}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: css.text,
                    cursor: !canSeeTimes ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    fontFamily: css.font,
                  }}
                >
                  {checking ? "Checking..." : "See times"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canContinueFromTimes}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "0",
                    background: !canContinueFromTimes
                      ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(90deg, ${css.orange}, ${css.orange2})`,
                    color: !canContinueFromTimes ? css.muted : "#0b0b0b",
                    cursor: !canContinueFromTimes ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    fontFamily: css.font,
                    boxShadow: !canContinueFromTimes
                      ? "none"
                      : "0 16px 35px rgba(248,68,0,0.22)",
                  }}
                >
                  Continue
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "0",
                    background: !canConfirm
                      ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(90deg, ${css.orange}, ${css.orange2})`,
                    color: !canConfirm ? css.muted : "#0b0b0b",
                    cursor: !canConfirm ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    fontFamily: css.font,
                    boxShadow: !canConfirm
                      ? "none"
                      : "0 16px 35px rgba(248,68,0,0.22)",
                  }}
                >
                  {busy ? "Booking..." : "Confirm booking"}
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: css.muted }}>
            This creates a real booking for venue:{" "}
            <code style={{ color: css.text }}>{venueId}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
