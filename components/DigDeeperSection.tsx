"use client";

import { useEffect, useState } from "react";
import type { DigDeeperItem } from "@/lib/types";

function MusicNotePlaceholder() {
  return (
    <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className="w-6 h-6 text-cream-dim/40"
      >
        <path
          d="M9 18V5l12-2v13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function DigDeeperCard({ item }: { item: DigDeeperItem }) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [artworkLoaded, setArtworkLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = encodeURIComponent(`${item.songTitle} ${item.artistName}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5`;

    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const artUrl: string | undefined = data?.results?.[0]?.artworkUrl100;
        if (artUrl) {
          setArtworkUrl(artUrl.replace(/\d+x\d+bb/, "300x300bb"));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [item.songTitle, item.artistName]);

  return (
    <div
      className="
        flex gap-4 p-4 rounded-md
        border border-white/[0.08]
        cursor-pointer
        hover:border-white/[0.15]
        transition-colors duration-200
      "
    >
      {/* Album art thumbnail */}
      <div className="relative w-16 h-16 rounded-sm overflow-hidden flex-shrink-0">
        {(!artworkUrl || !artworkLoaded) && (
          <div className="absolute inset-0">
            <MusicNotePlaceholder />
          </div>
        )}
        {artworkUrl && (
          <img
            src={artworkUrl}
            alt={`${item.songTitle} by ${item.artistName}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              artworkLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setArtworkLoaded(true)}
          />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[0.6rem] tracking-[0.18em] uppercase mb-1 text-[#C4A265]">
          {item.category}
        </p>
        <p className="font-serif font-bold text-[1.05rem] leading-tight text-cream/90 mb-0.5">
          {item.songTitle}
        </p>
        <p className="font-sans text-sm font-semibold text-cream/70 mb-2">
          {item.artistName}
        </p>
        <p className="font-body text-[0.925rem] leading-[1.65] text-cream/70">
          {item.explanation}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 rounded-md border border-white/[0.08]">
      <div className="w-16 h-16 rounded-sm flex-shrink-0 bg-chalk-line animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
      <div className="flex-1 min-w-0 space-y-2 py-1">
        <div className="h-2 rounded-full bg-chalk-line w-24 animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
        <div className="h-3.5 rounded-full bg-chalk-line w-36 animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
        <div className="h-3 rounded-full bg-chalk-line w-28 animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
        <div className="h-3 rounded-full bg-chalk-line w-full animate-[skeleton-pulse_1.4s_ease-in-out_infinite] mt-1" />
      </div>
    </div>
  );
}

interface DigDeeperSectionProps {
  items?: DigDeeperItem[] | null;
  loading?: boolean;
}

export default function DigDeeperSection({ items, loading }: DigDeeperSectionProps) {
  const showSkeleton = loading && (!items || items.length === 0);
  const showCards = items && items.length > 0;

  if (!showSkeleton && !showCards) return null;

  return (
    <section>
      <h2 className="font-serif font-bold text-2xl text-cream/80 mb-6">
        Dig Deeper
      </h2>
      {showCards ? (
        <div className="space-y-4 animate-[fade-in_0.6s_ease-out_forwards]">
          {items.map((item) => (
            <DigDeeperCard key={`${item.songTitle}-${item.artistName}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
    </section>
  );
}
