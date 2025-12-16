// src/api.ts

import type { ChatResponse } from "../lib/types";

export type ChatSendPayload = {
  message: string;
  session_id?: string;
};

export async function chatSend(
  apiBase: string,
  venueId: string,
  embedKey: string,
  payload: ChatSendPayload
): Promise<{ raw: ChatResponse; text: string }> {
  const r = await fetch(`${apiBase}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // keep your existing enterprise headers
      "X-SS-Venue": venueId,
      "X-SS-Embed-Key": embedKey,
    },
    body: JSON.stringify({
      ...payload,
      venue_id: venueId, // harmless if duplicated; server can ignore
    }),
    cache: "no-store",
  });

  const rawText = await r.text().catch(() => "");

  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { reply: rawText };
  }

  if (!r.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      data?.error ||
      `chatSend failed (${r.status})`;
    throw new Error(String(msg));
  }

  // Normalise assistant-facing text WITHOUT destroying raw response
  const assistantText =
    data?.reply ??
    data?.answer ??
    data?.message ??
    data?.text ??
    (typeof data === "string" ? data : "");

  return {
    raw: data as ChatResponse,
    text: String(assistantText || ""),
  };
}
