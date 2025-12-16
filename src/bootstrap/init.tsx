import React from "react";
import { createRoot, type Root } from "react-dom/client";
import Widget from "../widget/Widget";

export type InitOpts = {
  venue: string;
  key: string;
  apiBase: string;
};

declare global {
  interface Window {
    SmartServeWidget?: { init: (opts: InitOpts) => void };
  }
}

let root: Root | null = null;

export function init(opts: InitOpts) {
  const id = "smartserve-widget-root";
  let el = document.getElementById(id);

  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }

  if (!root) root = createRoot(el);

  root.render(
    <React.StrictMode>
      <Widget
        venueId={opts.venue}
        embedKey={opts.key}
        apiBase={opts.apiBase}                     // chat service
        bookingApiBase="https://api.smartserveai.uk" // booking API
      />

    </React.StrictMode>
  );
}

// expose manual init (optional)
window.SmartServeWidget = { init };
