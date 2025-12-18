// src/components/booking/DatePicker.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;                 // "YYYY-MM-DD"
  onChange: (v: string) => void; // "YYYY-MM-DD"
  inputBase: React.CSSProperties;
  focusHandlers?: any;
  text: string;
  muted: string;
  border: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseISODate(s: string) {
  const m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: "block", color }} aria-hidden="true">
      <path d="M7 2v3M17 2v3M3.5 9h17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DatePicker({
  value,
  onChange,
  inputBase,
  focusHandlers,
  text,
  muted,
  border,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected = parseISODate(value);
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selected || today));

  useEffect(() => {
    const d = parseISODate(value);
    if (d) setViewMonth(startOfMonth(d));
  }, [value]);

  // click outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
    return fmt.format(viewMonth);
  }, [viewMonth]);

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);

    // monday-first grid
    const firstDow = (start.getDay() + 6) % 7;

    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < firstDow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (firstDow - i));
      cells.push({ date: d, inMonth: false });
    }

    for (let d = 1; d <= end.getDate(); d++) {
      cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }

    return cells;
  }, [viewMonth]);

  const inputStyle: React.CSSProperties = {
    ...inputBase,
    cursor: "pointer",
    userSelect: "none",
  };

  // INLINE panel (no absolute positioning = no clipping)
  const panelStyle: React.CSSProperties = {
    marginTop: 8,
    borderRadius: 14,
    border: `1px solid ${border}`,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    padding: 8,
  };

  const headerBtn: React.CSSProperties = {
    height: 30,
    width: 30,
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: "rgba(255,255,255,0.06)",
    color: text,
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
  };

  const dow = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        tabIndex={0}
        role="button"
        aria-label="Choose date"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        style={{ ...inputStyle, display: "flex", alignItems: "center" }}
        {...(focusHandlers || {})}
      >
        <span style={{ color: value ? text : muted }}>{value ? value : "Select date"}</span>
        <span style={{ marginLeft: "auto", opacity: 0.75, display: "flex" }}>
          <CalendarIcon color={text} />
        </span>
      </div>

      {open && (
        <div style={panelStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button type="button" style={headerBtn} onClick={() => setViewMonth((d) => addMonths(d, -1))} aria-label="Previous month">
              ‹
            </button>

            <div style={{ flex: 1, textAlign: "center", color: text, fontSize: 12, fontWeight: 900 }}>
              {monthLabel}
            </div>

            <button type="button" style={headerBtn} onClick={() => setViewMonth((d) => addMonths(d, 1))} aria-label="Next month">
              ›
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {dow.map((d, i) => (
              <div key={`${d}-${i}`} style={{ color: muted, fontSize: 11, textAlign: "center", opacity: 0.9 }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {days.map(({ date, inMonth }, idx) => {
              const disabled = date < today;
              const active = selected ? isSameDay(date, selected) : false;

              return (
                <button
                  key={`${idx}-${date.toISOString()}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onChange(toISODate(date));
                    setOpen(false);
                  }}
                  style={{
                    height: 30,
                    borderRadius: 10,
                    border: active ? "1px solid rgba(248,68,0,0.55)" : `1px solid ${border}`,
                    background: active
                      ? "linear-gradient(90deg, rgba(248,68,0,0.22), rgba(248,88,0,0.14))"
                      : "rgba(255,255,255,0.06)",
                    color: disabled
                      ? "rgba(255,255,255,0.22)"
                      : inMonth
                      ? text
                      : "rgba(255,255,255,0.45)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: active ? 900 : 800,
                    fontSize: 12,
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 12,
              border: `1px solid ${border}`,
              background: "rgba(255,255,255,0.06)",
              color: text,
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
