// src/widget/Widget.tsx
import React from "react";
import { ssFetch } from "./ssFetch";

type Props = {
  venueId: string;
  embedKey: string;
  apiBase: string;
};

export default function Widget({ venueId, embedKey, apiBase }: Props) {
  // quick sanity log (remove later)
  React.useEffect(() => {
    if (!venueId || !embedKey) {
      console.error("[SmartServeWidget] Missing venueId/embedKey");
    }
    if (!apiBase) {
      console.error("[SmartServeWidget] Missing apiBase");
    }
  }, [venueId, embedKey, apiBase]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2147483647,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <button
        type="button"
        title={`venue=${venueId} key=${embedKey} api=${apiBase}`}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "white",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          fontSize: 14,
        }}
        onClick={async () => {
          try {
            const r = await ssFetch(apiBase, venueId, embedKey, "/api/health", { method: "GET" });
            console.log("[SmartServeWidget] health status", r.status);
          } catch (e) {
            console.error(e);
          }
        }}

      >
        Chat Assistant • Powered by SmartServe AI
      </button>
    </div>
  );
}
