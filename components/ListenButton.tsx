"use client";

import { useState, useRef, useCallback } from "react";
import type { DeepCutResult } from "@/lib/types";

type ListenState =
  | "idle"
  | "requesting"
  | "recording"
  | "identifying";

interface ListenButtonProps {
  onResult: (result: DeepCutResult) => void;
  onError: (message: string, type?: "no_match" | "api_error") => void;
  onStateChange: (state: ListenState) => void;
}

const RECORD_DURATION_MS = 7000;

export default function ListenButton({
  onResult,
  onError,
  onStateChange,
}: ListenButtonProps) {
  const [state, setState] = useState<ListenState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback(
    (s: ListenState) => {
      setState(s);
      onStateChange(s);
    },
    [onStateChange]
  );

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleListen = useCallback(async () => {
    if (state !== "idle") return;

    try {
      updateState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Pick the best available MIME type (iOS Safari only supports audio/mp4)
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // For mp4 (iOS Safari, no timeslice), onstop fires BEFORE ondataavailable.
      // This promise resolves when the first data chunk arrives so onstop can wait for it.
      let resolveFirstData: (() => void) | null = null;
      const firstDataPromise = new Promise<void>((resolve) => {
        resolveFirstData = resolve;
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
        resolveFirstData?.();
        resolveFirstData = null;
      };

      recorder.onstop = async () => {
        stopStream();

        // iOS Safari fires onstop before ondataavailable when no timeslice is used.
        // Wait for the data event rather than racing a setTimeout(0).
        if (mimeType.includes("mp4")) {
          await Promise.race([
            firstDataPromise,
            new Promise<void>((resolve) => setTimeout(resolve, 500)),
          ]);
        }

        // Use the recorder's actual MIME type (not our pre-selected guess)
        const actualMimeType = recorder.mimeType || mimeType || "audio/webm";
        const ext = actualMimeType.includes("mp4") ? "mp4" : actualMimeType.includes("ogg") ? "ogg" : "webm";

        const audioBlob = new Blob(chunksRef.current, { type: actualMimeType });

        // Identify
        updateState("identifying");
        const formData = new FormData();
        formData.append("audio", audioBlob, `clip.${ext}`);

        const identifyRes = await fetch("/api/identify", {
          method: "POST",
          body: formData,
        });

        const identifyData = await identifyRes.json();

        if (!identifyData.success) {
          updateState("idle");
          onError(
            identifyData.message ?? "We couldn't place that one.",
            identifyData.error === "no_match" ? "no_match" : "api_error"
          );
          return;
        }

        // Navigate immediately — generate streams on the results page
        onResult({ song: identifyData.song });
        setTimeout(() => updateState("idle"), 500);
      };

      recorder.onerror = () => {
        stopStream();
        updateState("idle");
        onError("Recording failed. Please try again.", "api_error");
      };

      updateState("recording");
      // mp4 (iOS Safari): no timeslice — fMP4 chunks can't be reliably concatenated
      // webm/ogg: 250ms timeslice works fine for streaming collection
      recorder.start(mimeType.includes("mp4") ? undefined : 250);

      // Auto-stop after RECORD_DURATION_MS
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, RECORD_DURATION_MS);
    } catch (err) {
      stopStream();
      updateState("idle");

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError(
          "Microphone access was denied. Enable it in your browser settings and try again.",
          "api_error"
        );
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        onError("No microphone found on this device.", "api_error");
      } else {
        onError("Something went wrong. Please try again.", "api_error");
      }
    }
  }, [state, updateState, onResult, onError]);

  const isActive = state !== "idle";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Button */}
      <button
        onClick={handleListen}
        disabled={isActive}
        aria-label={isActive ? "Listening…" : "Tap to identify a song"}
        className={`
          relative flex items-center justify-center
          w-28 h-28 rounded-full
          transition-all duration-500 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ember
          ${
            isActive
              ? "bg-ember/10 border border-ember/30 cursor-default"
              : "bg-ember/15 border border-ember/40 hover:bg-ember/25 hover:border-ember/60 active:scale-95 cursor-pointer"
          }
        `}
      >
        {/* Pulse rings when recording */}
        {state === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full border border-ember/40 animate-[pulse-ring_1.8s_ease-out_infinite]" />
            <span className="absolute inset-0 rounded-full border border-ember/20 animate-[pulse-ring_1.8s_ease-out_0.6s_infinite]" />
          </>
        )}

        {/* Icon */}
        <MicIcon active={isActive} recording={state === "recording"} />
      </button>

      {/* Label */}
      <p
        className={`
          font-sans text-xs tracking-[0.2em] uppercase transition-all duration-300
          ${isActive ? "text-ember" : "text-cream-dim"}
        `}
      >
        {state === "idle" && "Tap to listen"}
        {state === "requesting" && "Allow microphone…"}
        {state === "recording" && "Listening…"}
        {state === "identifying" && "On it…"}
      </p>
    </div>
  );
}

function MicIcon({
  active,
  recording,
}: {
  active: boolean;
  recording: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={`w-9 h-9 transition-colors duration-300 ${
        recording ? "text-ember" : active ? "text-ember/70" : "text-cream/80"
      }`}
    >
      <path
        d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M9 22h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
