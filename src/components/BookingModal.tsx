// src/components/BookingModal.tsx

import { useEffect, useMemo, useState } from "react";
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

  // Configure these once; don’t hardcode endpoints all over the repo
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

  // If modal opens with no prefill, don’t wipe existing user input unless you want that.
  // This preserves what user typed if they closed/reopened.
  useEffect(() => {
    if (!open) {
      setErr(null);
      setAvailability(null);
      setBusy(false);
      setChecking(false);
    }
  }, [open]);

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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 10,
      }}
      onMouseDown={(e) => {
        // close if click outside panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          padding: 12,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <strong>Book a table</strong>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16 }}
            aria-label="Close booking form"
            title="Close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ fontSize: 12 }}>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: missing.includes("date") ? "1px solid #b00020" : "1px solid #ddd",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: missing.includes("time") ? "1px solid #b00020" : "1px solid #ddd",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Party size
            <input
              type="number"
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: missing.includes("party size") ? "1px solid #b00020" : "1px solid #ddd",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: missing.includes("name") ? "1px solid #b00020" : "1px solid #ddd",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>
            Contact (optional)
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: "1px solid #ddd",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>
            Special requests (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Allergies, seating, etc."
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 10,
                border: "1px solid #ddd",
                marginTop: 4,
                resize: "none",
              }}
            />
          </label>
        </div>

        {err && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#b00020" }}>
            {err}
          </div>
        )}

        {availability?.slots?.length ? (
          <div style={{ marginTop: 10, fontSize: 12 }}>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>Availability:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {availability.slots
                .filter((s) => s.available)
                .slice(0, 10)
                .map((s) => (
                  <button
                    key={s.time_24h}
                    onClick={() => setTime(s.time_24h)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                    title="Use this time"
                  >
                    {s.time_24h}
                  </button>
                ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={onCheckAvailability}
            disabled={checking || busy}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: checking || busy ? "not-allowed" : "pointer",
            }}
          >
            {checking ? "Checking..." : "Check"}
          </button>

          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: busy ? "#f5f5f5" : "#111",
              color: busy ? "#111" : "white",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Booking..." : "Confirm"}
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.65 }}>
          This creates a real booking for venue: <code>{venueId}</code>
        </div>
      </div>
    </div>
  );
}
