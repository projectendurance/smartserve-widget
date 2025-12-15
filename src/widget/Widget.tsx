import { useMemo, useState } from "react";


type Props = { venueId: string; embedKey: string; apiBase: string };

export default function Widget({ venueId, embedKey, apiBase }: Props) {
  const [open, setOpen] = useState(false);

  const title = useMemo(
    () => `venue=${venueId} key=${embedKey.slice(0, 8)}… api=${apiBase}`,
    [venueId, embedKey, apiBase]
  );

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <div
          style={{
            width: 340,
            height: 440,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            overflow: "hidden",
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
              fontSize: 14,
            }}
          >
            <strong>SmartServe Assistant</strong>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
              }}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          <div style={{ padding: 12, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", fontSize: 13 }}>
            <div style={{ opacity: 0.7, marginBottom: 8 }}>Widget config:</div>
            <div><b>Venue:</b> {venueId}</div>
            <div><b>API:</b> {apiBase}</div>
            <div style={{ opacity: 0.7, marginTop: 10 }}>
              Next step: wire chat send to your llama endpoint using these headers.
            </div>
          </div>

          <div style={{ marginTop: "auto", padding: 12, borderTop: "1px solid #eee", opacity: 0.7, fontSize: 12 }}>
            {title}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title={title}
        style={{
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "white",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        Chat Assistant • Powered by SmartServe AI
      </button>
    </div>
  );
}
