"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Scanning the signal…",
  "Cross-referencing the archive…",
  "Pulling the thread…",
  "Composing the story…",
  "Going deep…",
];

// 40 bars across the full width
const BAR_COUNT = 40;

// Each bar gets a random base delay and duration so the wave feels organic
function getBarStyle(index: number): React.CSSProperties {
  const delay = (index * 0.04 + Math.sin(index) * 0.15).toFixed(3);
  const duration = (1.0 + Math.sin(index * 0.7) * 0.3).toFixed(3);
  return {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
}

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full gap-10 px-0">
      {/* Waveform — full bleed left to right */}
      <div
        className="w-full flex items-center gap-[2px]"
        style={{ height: "80px" }}
        aria-hidden="true"
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-ember animate-[waveform-bar_1.2s_ease-in-out_infinite]"
            style={getBarStyle(i)}
          />
        ))}
      </div>

      {/* Cycling message */}
      <p
        key={messageIndex}
        className="font-sans text-xs tracking-[0.22em] uppercase text-cream-dim animate-[fade-in_0.5s_ease-out_forwards]"
      >
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
