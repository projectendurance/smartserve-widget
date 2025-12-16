// src/lib/types.ts

export type BookingPrefill = {
  party_size?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // "19:00" or "19:00:00" (we'll normalize)
  name?: string;
  contact?: string;
  special_requests?: string;
};

export type ChatAction =
  | { type: "OPEN_BOOKING_FORM"; prefill?: BookingPrefill }
  | { type: "NONE" };

export type ChatResponse = {
  schema_version?: number; // optional but recommended
  reply?: string;
  action?: ChatAction | null;

  // backwards compat if chat service still returns { text: "..." }
  text?: string;

  // optional for debugging
  meta?: Record<string, any>;
};

export type AvailabilityRequest = {
  venue_id: string;
  date: string; // YYYY-MM-DD
  party_size: number;
  time_24h?: string | null; // "19:00" optional
};

export type AvailabilitySlot = {
  time_24h: string;
  available: boolean;
};

export type AvailabilityResponse = {
  slots: AvailabilitySlot[];
};

export type CreateBookingRequest = {
  venue_id: string;
  date: string;
  time_24h: string; // "19:00"
  party_size: number;
  name: string;
  contact?: string;
  special_requests?: string;
};

export type CreateBookingResponse = {
  confirmation_code?: string;
  manage_url?: string;

  // forward-compatible for Stripe deposits later
  status?: "confirmed" | "requires_payment";
  checkout_url?: string;
  expires_at?: string;
};
