import React, { useEffect, useRef } from "react";

type Props = {
  date: string;
  time: string;
  partySize: number;

  name: string;
  setName: (v: string) => void;

  contact: string;
  setContact: (v: string) => void;

  notes: string;
  setNotes: (v: string) => void;

  textareaBase: React.CSSProperties;
  inputBase: React.CSSProperties;
  labelStyle: React.CSSProperties;
  focusHandlers: {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };

  onBack: () => void;
  disabled: boolean;

  font: string;
  text: string;
  muted: string;
};

export default function StepDetails({
  date,
  time,
  partySize,
  name,
  setName,
  contact,
  setContact,
  notes,
  setNotes,
  textareaBase,
  inputBase,
  labelStyle,
  focusHandlers,
  onBack,
  disabled,
  font,
  text,
  muted,
}: Props) {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, color: muted }}>
          Enter your details to confirm.
        </div>

        <button
          onClick={onBack}
          disabled={disabled}
          style={{
            marginLeft: "auto",
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: text,
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: 12,
            fontFamily: font,
            fontWeight: 800,
          }}
        >
          Back
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: text,
            fontSize: 11.5,
            fontFamily: font,
            fontWeight: 800,
          }}
        >
          {date || "—"} • {time || "—"} • {partySize}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Name</label>
          <input
            ref={firstFieldRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ ...inputBase }}
            {...focusHandlers}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Contact (optional)</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone"
            style={{ ...inputBase }}
            {...focusHandlers}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Special requests (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Allergies, seating, etc."
            style={textareaBase}
            {...focusHandlers}
          />
        </div>
      </div>
    </>
  );
}
