// src/bootstrap/initFromScriptTag.ts
import { init } from "./init";

export function initFromScriptTag() {
  const script = document.currentScript as HTMLScriptElement | null;

  // Read config from the <script> tag that loaded the widget
  const venue =
    script?.getAttribute("data-ss-venue") ||
    script?.dataset?.ssVenue ||
    "";

  const embedKey =
    script?.getAttribute("data-ss-embed-key") ||
    script?.dataset?.ssEmbedKey ||
    "";

  const apiBase =
    script?.getAttribute("data-ss-api-base") ||
    script?.dataset?.ssApiBase ||
    "https://api.smartserveai.uk";

  if (!venue || !embedKey) {
    console.error(
      "SmartServeWidget: missing data-ss-venue or data-ss-embed-key on script tag."
    );
    return;
  }

  // Pass through to your app bootstrap (store/use these in state/config)
  init({ venue, key: embedKey, apiBase });
}
