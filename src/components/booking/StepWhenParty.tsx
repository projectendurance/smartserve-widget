import React, { useEffect, useRef } from "react";

type Props = {
  date: string;
  partySize: number;

  setDate: (v: string) => void;
  setPartySize: (v: number) => void;

  labelStyle: React.CSSProperties;
  inputBase: React.CSSProperties;
  focusHandlers: {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  };

  introTextStyle: React.CSSProperties;
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
}: Props) {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

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
          <input
            ref={firstFieldRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ ...inputBase }}
            {...focusHandlers}
          />
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
