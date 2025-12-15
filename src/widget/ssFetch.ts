export async function ssFetch(
  apiBase: string,
  venueId: string,
  embedKey: string,
  path: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("X-SS-Venue", venueId);
  headers.set("X-SS-Embed-Key", embedKey);

  const res = await fetch(`${apiBase}${path}`, { ...options, headers });

  // make debugging obvious
  if (res.status === 403) {
    const txt = await res.text().catch(() => "");
    throw new Error(`403 Forbidden (embed validation): ${txt || "blocked"}`);
  }

  return res;
}
