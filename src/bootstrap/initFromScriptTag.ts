import { init } from "./init";

function findOurScript(): HTMLScriptElement | null {
  // Prefer currentScript if available
  const cs = document.currentScript as HTMLScriptElement | null;
  if (cs) return cs;

  // Fallback: find by known widget src
  const scripts = Array.from(document.getElementsByTagName("script"));
  return (
    scripts.find((s) => (s.src || "").includes("cdn.smartserveai.uk/widget.js")) ||
    scripts.find((s) => (s.src || "").includes("/widget.js")) ||
    null
  );
}

export function initFromScriptTag() {
  const script = findOurScript();

  if (!script) {
    console.error("[SmartServeWidget] Could not find widget <script> tag on page.");
    return;
  }

  const venue =
    script.getAttribute("data-ss-venue") ||
    script.dataset?.ssVenue ||
    "";

  const embedKey =
    script.getAttribute("data-ss-embed-key") ||
    script.dataset?.ssEmbedKey ||
    "";

  // ✅ ENTERPRISE DEFAULT: chat service, NOT booking-api
  const apiBase =
    script.getAttribute("data-ss-api-base") ||
    script.dataset?.ssApiBase ||
    "https://chat.smartserveai.uk";

  if (!venue || !embedKey) {
    console.error(
      "[SmartServeWidget] Missing data-ss-venue or data-ss-embed-key on script tag.",
      {
        venue,
        embedKeyPresent: !!embedKey,
        apiBase,
      }
    );
    return;
  }

  init({
    venue,
    key: embedKey,
    apiBase,
  });
}
