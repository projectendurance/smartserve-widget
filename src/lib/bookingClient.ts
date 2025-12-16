// src/lib/bookingClient.ts

import type {
  AvailabilityRequest,
  AvailabilityResponse,
  CreateBookingRequest,
  CreateBookingResponse,
} from "./types";

function withNoTrailingSlash(s: string) {
  return (s || "").replace(/\/+$/, "");
}

async function parseJsonOrText(r: Response) {
  const text = await r.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function normalizeTimeToHHMM(t: string) {
  const s = (t || "").trim();
  // accept "19:00:00" -> "19:00"
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function checkAvailability(
  bookingApiBase: string,
  venueId: string,
  embedKey: string,
  payload: AvailabilityRequest,
  availabilityPath: string
): Promise<AvailabilityResponse> {
  const base = withNoTrailingSlash(bookingApiBase);
  const url = `${base}${availabilityPath}`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Venue-Id": venueId,
      "X-Embed-Key": embedKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonOrText(r);

  if (!r.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Availability failed (${r.status}).`;
    throw new Error(String(msg));
  }

  const slots = Array.isArray(data?.slots) ? data.slots : [];
  return { slots };
}

export async function createBooking(
  bookingApiBase: string,
  venueId: string,
  embedKey: string,
  payload: CreateBookingRequest,
  createBookingPath: string
): Promise<CreateBookingResponse> {
  const base = withNoTrailingSlash(bookingApiBase);
  const url = `${base}${createBookingPath}`;

  // normalize time for safety
  const time_24h = normalizeTimeToHHMM(payload.time_24h);

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Venue-Id": venueId,
      "X-Embed-Key": embedKey,
    },
    body: JSON.stringify({ ...payload, time_24h }),
    cache: "no-store",
  });

  const data = await parseJsonOrText(r);

  if (!r.ok) {
    const msg =
      data?.detail || data?.message || data?.error || `Booking failed (${r.status}).`;
    throw new Error(String(msg));
  }

  return {
    confirmation_code: data?.confirmation_code ? String(data.confirmation_code) : undefined,
    manage_url: data?.manage_url ? String(data.manage_url) : undefined,
    status: data?.status,
    checkout_url: data?.checkout_url,
    expires_at: data?.expires_at,
  };
}
