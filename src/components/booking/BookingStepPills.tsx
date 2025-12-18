

export type Step = 1 | 2 | 3;

type Props = {
  step: Step;
};

export default function BookingStepPills({ step }: Props) {
  const css = {
    text: "var(--ss-text, rgba(255,255,255,0.92))",
    font:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
  };

  const pill = (n: Step, label: string) => {
    const active = step === n;
    const done = step > n;
    return (
      <div
        key={n}
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border:
            active || done
              ? "1px solid rgba(248,68,0,0.40)"
              : "1px solid rgba(255,255,255,0.12)",
          background: active
            ? "linear-gradient(90deg, rgba(248,68,0,0.18), rgba(248,88,0,0.10))"
            : "rgba(255,255,255,0.06)",
          color: css.text,
          fontSize: 11,
          fontFamily: css.font,
          fontWeight: active ? 900 : 700,
          opacity: done ? 0.95 : 1,
          userSelect: "none",
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {pill(1, "1. When")}
      {pill(2, "2. Time")}
      {pill(3, "3. Details")}
    </div>
  );
}
