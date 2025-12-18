import React, { useEffect, useRef } from "react";
import DatePicker from "./DatePicker";

type Props = {
  date: string;
  partySize: number;

  setDate: (v: string) => void;
  setPartySize: (v: number) => void;

  labelStyle: React.CSSProperties;
  inputBase: React.CSSProperties;

  focusHandlers: {
    onFocus: (e: React.FocusEvent<any>) => void;
    onBlur: (e: React.FocusEvent<any>) => void;
  };

  introTextStyle: React.CSSProperties;

  // new (for DatePicker styling)
  text: string;
  muted: string;
  border: string;
};

export default function StepWhenParty({
  date,
  partySize,
  setDate,
  setPartySize,
  labelStyle,
  inputBase,
  focusHandlers,
  introTextStyle,
  text,
  muted,
  border,
}: Props) {
  const firstFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div style={introTextStyle}>
        Choose date + party size. Then we’ll show available times.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div>
          <label style={labelStyle}>Date</label>

          {/* wrapper exists only so we can auto-focus something on step open */}
          <div ref={firstFieldRef} tabIndex={-1} style={{ outline: "none" }}>
            <DatePicker
              value={date}
              onChange={setDate}
              inputBase={inputBase}
              focusHandlers={focusHandlers}
              text={text}
              muted={muted}
              border={border}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Party size</label>
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            style={{ ...inputBase }}
            {...focusHandlers}
          />
        </div>
      </div>
    </>
  );
}
