import SectionBlock from "./SectionBlock";
import type { DeepCutResult } from "@/lib/types";

interface DeepCutPageProps {
  result: DeepCutResult;
  onBack: () => void;
}

export default function DeepCutPage({ result, onBack }: DeepCutPageProps) {
  const { song, content } = result;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* ── Background: blurred album art ── */}
      {song.imageUrl && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${song.imageUrl})`,
              filter: "blur(60px) saturate(0.5)",
              transform: "scale(1.1)",
              opacity: 0.18,
              zIndex: 0,
            }}
            aria-hidden="true"
          />
          {/* Dark scrim so text is always readable */}
          <div
            className="fixed inset-0 bg-void/85"
            style={{ zIndex: 1 }}
            aria-hidden="true"
          />
        </>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-4">
          <button
            onClick={onBack}
            aria-label="Back"
            className="
              flex items-center gap-1.5 text-cream-dim
              hover:text-cream transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-sm
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
            >
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="font-sans text-[0.6rem] font-semibold tracking-[0.35em] uppercase text-cream-dim">
            Deep Cut
          </span>

          {/* Placeholder so header stays centered */}
          <div className="w-5" aria-hidden="true" />
        </header>

        {/* Hero */}
        <div className="px-5 pt-8 pb-10 animate-[fade-in_0.7s_ease-out_forwards]">
          <h1 className="font-serif font-bold leading-[0.95] text-cream mb-3 break-words"
              style={{ fontSize: "clamp(2.4rem, 10vw, 4.5rem)" }}>
            {song.title.toUpperCase()}.
          </h1>
          <p className="font-sans text-sm font-medium tracking-[0.18em] uppercase text-cream-dim">
            {song.artist}
          </p>
          {(song.album || song.releaseYear) && (
            <p className="font-sans text-xs tracking-[0.12em] uppercase text-cream-dim/60 mt-1.5">
              {[song.album, song.releaseYear].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-chalk-line mx-0" />

        {/* Sections */}
        <main className="flex-1 px-5 py-8 space-y-10">
          <SectionBlock header="Band History" body={content.bandHistory} />
          <div className="w-full h-px bg-chalk-line" />

          <SectionBlock header="The Story Behind This Song" body={content.storyBehindSong} />
          <div className="w-full h-px bg-chalk-line" />

          <SectionBlock header="Critical Reception" body={content.criticalReception} />

          {content.controversies && (
            <>
              <div className="w-full h-px bg-chalk-line" />
              <SectionBlock header="Controversies" body={content.controversies} />
            </>
          )}

          <div className="w-full h-px bg-chalk-line" />
          <SectionBlock header="Trivia & Deep Lore" body={content.triviaAndDeepLore} />
        </main>

        {/* Footer CTA */}
        <div className="px-5 pb-safe pb-10 pt-4 flex justify-center">
          <button
            onClick={onBack}
            className="
              font-sans text-[0.65rem] tracking-[0.2em] uppercase
              text-cream-dim border border-chalk-line
              px-6 py-3 rounded-sm w-full max-w-xs
              hover:text-cream hover:border-cream/30
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ember
            "
          >
            Back to Listening Room
          </button>
        </div>
      </div>
    </div>
  );
}
