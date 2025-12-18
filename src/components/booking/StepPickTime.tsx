

type Props = {
  time: string;
  setTime: (v: string) => void;

  availableTimes: string[];

  disabled: boolean;
  onBack: () => void;

  font: string;
  text: string;
  muted: string;
};

export default function StepPickTime({
  time,
  setTime,
  availableTimes,
  disabled,
  onBack,
  font,
  text,
  muted,
}: Props) {
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
        <div style={{ fontSize: 12, color: muted }}>Pick an available time.</div>

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

      {availableTimes.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {availableTimes.map((t) => {
            const active = t === time;
            return (
              <button
                key={t}
                onClick={() => setTime(t)}
                style={{
                  padding: "10px 10px",
                  borderRadius: 12,
                  border: active
                    ? "1px solid rgba(248,68,0,0.55)"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: active
                    ? "linear-gradient(90deg, rgba(248,68,0,0.22), rgba(248,88,0,0.14))"
                    : "rgba(255,255,255,0.06)",
                  color: text,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontFamily: font,
                  fontWeight: active ? 900 : 800,
                  textAlign: "center",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: muted }}>
          No times to show. Go back and try a different date/party size.
        </div>
      )}
    </>
  );
}
