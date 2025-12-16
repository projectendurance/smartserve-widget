// src/api.ts

import type { ChatResponse } from "../lib/types";

export type ChatSendPayload = {
  message: string;
  session_id?: string;
};

export async function chatSend(
  apiBase: string,
  venueId: string,
  _embedKey: string, // intentionally unused for chat
  payload: ChatSendPayload
): Promise<{ raw: ChatResponse; text: string }> {
  const r = await fetch(`${apiBase}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      // ✅ REQUIRED for LLaMA auth
      "x-api-key": import.meta.env.VITE_CHAT_API_KEY,

      // ✅ REQUIRED for multi-venue isolation
      "x-venue-id": venueId,
    },
    body: JSON.stringify({
      ...payload,
      venue_id: venueId, // safe duplicate, server ignores if redundant
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
