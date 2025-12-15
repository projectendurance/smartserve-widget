export type ChatSendPayload = {
  message: string;
  session_id?: string;
};

type ChatSendResponse =
  | { reply?: string; answer?: string; message?: string; text?: string }
  | any;

export async function chatSend(
  apiBase: string,
  venueId: string,
  embedKey: string,
  payload: ChatSendPayload
) {
  const r = await fetch(`${apiBase}/api/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SS-Venue": venueId,
      "X-SS-Embed-Key": embedKey,
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`chatSend failed: ${r.status} ${txt}`);
  }

  const data: ChatSendResponse = await r.json();
  const assistantText =
    data?.reply ??
    data?.answer ??
    data?.message ??
    data?.text ??
    (typeof data === "string" ? data : JSON.stringify(data));

  return { raw: data, text: String(assistantText) };
}
