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
      // Persist result to sessionStorage so the deep-cut page can read it
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
        listenState === "generating" ||
        listenState === "recording" ||
        listenState === "requesting"
      ) {
        setAppState({ phase: "loading" });
      } else if (listenState === "idle") {
        // Don't reset to idle if we're in an error state — ErrorState handles retry
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

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-center px-5 pt-safe pt-5 pb-4"
      >
        <span className="font-sans text-[0.6rem] font-semibold tracking-[0.4em] uppercase text-cream-dim">
          Deep Cut
        </span>
      </header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-16">
        {appState.phase !== "error" ? (
          <div
            className={`
              w-full flex flex-col items-center gap-8
              transition-opacity duration-500
              ${isLoading ? "opacity-100" : "opacity-100"}
            `}
          >
            {/* Tagline — hidden while loading */}
            {!isLoading && (
              <div className="text-center space-y-2 animate-[fade-in_0.7s_ease-out_forwards]">
                <p className="font-serif italic text-2xl text-cream/60 leading-snug">
                  What's that song?
                </p>
                <p className="font-sans text-xs tracking-[0.15em] uppercase text-cream-dim/50">
                  Hold your phone toward the music
                </p>
              </div>
            )}

            {/* Loading waveform */}
            {isLoading && (
              <div className="w-full animate-[fade-in_0.4s_ease-out_forwards]">
                <LoadingState />
              </div>
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
