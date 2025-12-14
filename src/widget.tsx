import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

function Widget() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "56px",
        height: "56px",
        borderRadius: "999px",
        background: "#f76a13",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        zIndex: 2147483647,
      }}
    >
      AI
    </div>
  );
}

function mount() {
  if (document.getElementById("smartserve-widget-root")) return;

  const el = document.createElement("div");
  el.id = "smartserve-widget-root";
  document.body.appendChild(el);

  createRoot(el).render(
    <StrictMode>
      <Widget />
    </StrictMode>
  );

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
