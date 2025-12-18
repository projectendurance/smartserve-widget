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
function clampToTodayOrAfter(d: Date) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x < t ? t : x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "block", color }}
      aria-hidden="true"
    >
      <path
        d="M7 2v3M17 2v3M3.5 9h17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(selected ? clampToTodayOrAfter(selected) : today)
  );

  // keep calendar month in sync when value changes externally
  useEffect(() => {
    const d = parseISODate(value);
    if (d) setViewMonth(startOfMonth(clampToTodayOrAfter(d)));
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

  // esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    });
    return fmt.format(viewMonth);
  }, [viewMonth]);

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);

    // monday-first grid (Mon=0 .. Sun=6)
    const firstDow = (start.getDay() + 6) % 7;

    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (firstDow - i));
      cells.push({ date: d, inMonth: false });
    }

    for (let d = 1; d <= end.getDate(); d++) {
      cells.push({
        date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d),
        inMonth: true,
      });
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

  // UPDATED: open DOWN + compact + premium surface using your theme tokens
  const popStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,

    // open DOWN (prevents collisions in the modal)
    top: "calc(100% + 8px)",
    bottom: "auto",

    borderRadius: 16,
    border: `1px solid ${border}`,
    background:
      "radial-gradient(650px 280px at 50% 0%, rgba(248, 68, 0, 0.12), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04))",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(248,68,0,0.18)",
    padding: 10,
    zIndex: 50,

    // compact / safe sizing
    maxWidth: 320,
    margin: "0 auto",
  };

  // UPDATED: smaller header buttons
  const headerBtn: React.CSSProperties = {
    height: 28,
    width: 28,
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: "rgba(255,255,255,0.06)",
    color: text,
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
  };

  const quickBtn: React.CSSProperties = {
    padding: "7px 10px",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: "rgba(0,0,0,0.22)",
    color: text,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  };

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

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
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          color: text,
        }}
        {...(focusHandlers || {})}
      >
        <span style={{ color: value ? text : muted }}>
          {value ? value : "Select date"}
        </span>

        <span style={{ marginLeft: "auto", opacity: 0.75, display: "flex" }}>
          <CalendarIcon color={text} />
        </span>
      </div>

      {open && (
        <div style={popStyle}>
          {/* Quick picks */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              style={{
                ...quickBtn,
                flex: 1,
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
              }}
              onClick={() => {
                onChange(toISODate(today));
                setOpen(false);
              }}
            >
              Today
            </button>

            <button
              type="button"
              style={{
                ...quickBtn,
                flex: 1,
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
              }}
              onClick={() => {
                onChange(toISODate(tomorrow));
                setOpen(false);
              }}
            >
              Tomorrow
            </button>
          </div>

          {/* Month header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              style={headerBtn}
              onClick={() => setViewMonth((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>

            <div
              style={{
                flex: 1,
                textAlign: "center",
                color: text,
                fontSize: 12.5,
                fontWeight: 900,
                letterSpacing: 0.2,
              }}
            >
              {monthLabel}
            </div>

            <button
              type="button"
              style={headerBtn}
              onClick={() => setViewMonth((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* DOW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 5,
              marginBottom: 6,
            }}
          >
            {dow.map((d) => (
              <div
                key={d}
                style={{
                  color: muted,
                  fontSize: 11,
                  textAlign: "center",
                  opacity: 0.9,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 5,
            }}
          >
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
                    border: active
                      ? "1px solid var(--ss-orange-ring)"
                      : `1px solid ${border}`,
                    background: active
                      ? "linear-gradient(90deg, var(--ss-orange-soft), rgba(248,88,0,0.14))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                    color: disabled
                      ? "rgba(255,255,255,0.22)"
                      : inMonth
                      ? text
                      : "rgba(255,255,255,0.45)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: active ? 900 : 800,
                    fontSize: 12,
                    boxShadow: active
                      ? "0 10px 24px rgba(248,68,0,0.18)"
                      : "none",
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer actions (removed big Close button for compact UX) */}
        </div>
      )}
    </div>
  );
}
