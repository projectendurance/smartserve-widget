// src/components/BookingModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import type {
  AvailabilityResponse,
  BookingPrefill,
  CreateBookingResponse,
} from "../lib/types";
import { checkAvailability, createBooking } from "../lib/bookingClient";

// NEW: split-step components
import BookingStepPills from "./booking/BookingStepPills";
import type { Step } from "./booking/BookingStepPills";
import StepWhenParty from "./booking/StepWhenParty";
import StepPickTime from "./booking/StepPickTime";
import StepDetails from "./booking/StepDetails";

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

  const introTextStyle: React.CSSProperties = {
    marginBottom: 10,
    fontSize: 12,
    color: css.muted,
  };

  // Prefill
  useEffect(() => {
    if (!open) return;

    // Reset per-open UI state
    setErr(null);
    setBusy(false);
    setChecking(false);

    if (!prefill) {
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

    const hasDate = Boolean(prefill.date);
    const hasParty =
      typeof prefill.party_size === "number" && prefill.party_size > 0;
    const hasTime = Boolean(prefill.time);

    if (hasDate && hasParty && hasTime) setStep(3);
    else setStep(1);

    setAvailability(null);
  }, [prefill, open]);

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
          time_24h: null,
        },
        availabilityPath
      );
      setAvailability(res);

      const times = uniqueAvailableSlots(res);
      if (times.length) {
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

            <BookingStepPills step={step} />
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

        {/* Body */}
        <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <StepWhenParty
              date={date}
              partySize={partySize}
              setDate={setDate}
              setPartySize={setPartySize}
              labelStyle={labelStyle}
              inputBase={inputBase}
              focusHandlers={focusHandlers}
              introTextStyle={introTextStyle}
            />
          )}

          {step === 2 && (
            <StepPickTime
              time={time}
              setTime={setTime}
              availableTimes={availableTimes}
              disabled={checking || busy}
              onBack={() => setStep(1)}
              font={css.font}
              text={css.text}
              muted={css.muted}
            />
          )}

          {step === 3 && (
            <StepDetails
              date={date}
              time={time}
              partySize={partySize}
              name={name}
              setName={setName}
              contact={contact}
              setContact={setContact}
              notes={notes}
              setNotes={setNotes}
              textareaBase={textareaBase}
              inputBase={inputBase}
              labelStyle={labelStyle}
              focusHandlers={focusHandlers}
              onBack={() => setStep(2)}
              disabled={checking || busy}
              font={css.font}
              text={css.text}
              muted={css.muted}
            />
          )}

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

        {/* Sticky footer */}
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${css.border}`,
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {step === 1 && (
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
            )}

            {step === 2 && (
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
            )}

            {step === 3 && (
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
