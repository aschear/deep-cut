"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ListenButton from "@/components/ListenButton";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import type { DeepCutResult } from "@/lib/types";

type AppState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string; type?: "no_match" | "api_error" };

export default function Home() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>({ phase: "idle" });

  const handleResult = useCallback(
    (result: DeepCutResult) => {
      // Store song (content streams on the results page)
      sessionStorage.setItem("deepCutResult", JSON.stringify(result));
      router.push("/deep-cut");
    },
    [router]
  );

  const handleError = useCallback(
    (message: string, type?: "no_match" | "api_error") => {
      setAppState({ phase: "error", message, type });
    },
    []
  );

  const handleStateChange = useCallback(
    (listenState: string) => {
      if (
        listenState === "identifying" ||
        listenState === "recording" ||
        listenState === "requesting"
      ) {
        setAppState({ phase: "loading" });
      } else if (listenState === "idle") {
        setAppState((prev) =>
          prev.phase === "error" ? prev : { phase: "idle" }
        );
      }
    },
    []
  );

  const handleRetry = useCallback(() => {
    setAppState({ phase: "idle" });
  }, []);

  const isLoading = appState.phase === "loading";

  return (
    <div className="relative min-h-dvh w-full bg-void overflow-hidden flex flex-col">
      {/* Subtle grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-16">
        {appState.phase !== "error" ? (
          <div className="w-full flex flex-col items-center gap-14 transition-opacity duration-500">

            {/* Logo + wordmark — hidden while loading */}
            {!isLoading && (
              <div className="flex flex-col items-center gap-2 animate-[fade-in_0.7s_ease-out_forwards] w-[60vw]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Deep Cut logo" className="w-full h-auto" />
                <p className="font-display text-[clamp(3rem,_13vw,_6rem)] leading-none uppercase text-cream/80 text-center">
                  <span className="tracking-[0.04em]">Deep</span><br />
                  <span className="tracking-[0.12em]">Cut</span>
                </p>
              </div>
            )}

            {/* Loading waveform */}
            {isLoading && (
              <div className="w-full animate-[fade-in_0.4s_ease-out_forwards]">
                <LoadingState />
              </div>
            )}

            {/* Tagline + button — hidden while loading */}
            <div className="flex flex-col items-center gap-5">
              {!isLoading && (
                <p className="font-serif italic text-lg text-cream/60 leading-snug animate-[fade-in_0.7s_ease-out_forwards]">
                  Hear a song. Read its story.
                </p>
              )}

              {/* Listen button — always present, hidden visually when loading */}
              <div className={isLoading ? "opacity-0 pointer-events-none absolute" : ""}>
                <ListenButton
                  onResult={handleResult}
                  onError={handleError}
                  onStateChange={handleStateChange}
                />
              </div>
            </div>

          </div>
        ) : (
          <ErrorState
            message={appState.message}
            type={appState.type}
            onRetry={handleRetry}
          />
        )}
      </main>

      {/* Footer wordmark */}
      <footer className="relative z-10 pb-safe pb-6 flex justify-center">
        <p className="font-sans text-[0.5rem] tracking-[0.3em] uppercase text-cream-dim/30">
          Deep Cut
        </p>
      </footer>
    </div>
  );
}
