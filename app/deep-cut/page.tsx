"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DeepCutPage from "@/components/DeepCutPage";
import type { SongMatch, DeepCutContent, SectionKey, DigDeeperItem } from "@/lib/types";

type GenerateState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done" };

export default function DeepCutRoute() {
  const router = useRouter();
  const [song, setSong] = useState<SongMatch | null>(null);
  const [content, setContent] = useState<Partial<DeepCutContent>>({});
  const [digDeeper, setDigDeeper] = useState<DigDeeperItem[] | null>(null);
  const [generateState, setGenerateState] = useState<GenerateState>({ status: "loading" });
  const hasFetched = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("deepCutResult");
    if (!raw) {
      router.replace("/");
      return;
    }

    let parsed: { song: SongMatch };
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.replace("/");
      return;
    }

    setSong(parsed.song);

    // Only start streaming once
    if (hasFetched.current) return;
    hasFetched.current = true;

    const abortController = new AbortController();

    async function streamGenerate() {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.song),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          setGenerateState({ status: "error", message: "We couldn't pull the story on this one. Try again." });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by \n\n
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? ""; // last incomplete chunk stays in buffer

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith("data: ")) continue;

            let payload: Record<string, unknown>;
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (payload.done) {
              setGenerateState({ status: "done" });
              return;
            }

            if (payload.error) {
              setGenerateState({ status: "error", message: payload.error as string });
              return;
            }

            if (payload.section && typeof payload.content === "string") {
              const section = payload.section as SectionKey;
              const sectionContent = payload.content as string;
              if (section === "digDeeper") {
                try {
                  const parsed = JSON.parse(sectionContent);
                  if (Array.isArray(parsed)) setDigDeeper(parsed);
                } catch { /* skip malformed digDeeper */ }
              } else {
                setContent((prev) => ({
                  ...prev,
                  [section]: sectionContent || null,
                }));
              }
            }
          }
        }

        setGenerateState({ status: "done" });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setGenerateState({ status: "error", message: "Something went wrong. Try again." });
      }
    }

    streamGenerate();
    return () => abortController.abort();
  }, [router]);

  const handleBack = () => {
    sessionStorage.removeItem("deepCutResult");
    router.push("/");
  };

  const handleRetry = () => {
    hasFetched.current = false;
    setContent({});
    setDigDeeper(null);
    setGenerateState({ status: "loading" });
    // Re-trigger effect by re-mounting — simplest approach is to navigate and come back
    // But we already have the song, so just re-run streamGenerate inline
    if (!song) return;

    const abortController = new AbortController();

    async function retry() {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(song),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          setGenerateState({ status: "error", message: "We couldn't pull the story on this one. Try again." });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith("data: ")) continue;

            let payload: Record<string, unknown>;
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (payload.done) { setGenerateState({ status: "done" }); return; }
            if (payload.error) { setGenerateState({ status: "error", message: payload.error as string }); return; }
            if (payload.section && typeof payload.content === "string") {
              const section = payload.section as SectionKey;
              const sectionContent = payload.content as string;
              if (section === "digDeeper") {
                try {
                  const parsed = JSON.parse(sectionContent);
                  if (Array.isArray(parsed)) setDigDeeper(parsed);
                } catch { /* skip malformed digDeeper */ }
              } else {
                setContent((prev) => ({ ...prev, [section]: sectionContent || null }));
              }
            }
          }
        }
        setGenerateState({ status: "done" });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setGenerateState({ status: "error", message: "Something went wrong. Try again." });
      }
    }

    retry();
  };

  if (!song) {
    return <div className="min-h-dvh bg-void" />;
  }

  return (
    <DeepCutPage
      song={song}
      content={content}
      digDeeper={digDeeper}
      generateState={generateState.status}
      generateError={generateState.status === "error" ? generateState.message : undefined}
      onBack={handleBack}
      onRetry={handleRetry}
    />
  );
}
