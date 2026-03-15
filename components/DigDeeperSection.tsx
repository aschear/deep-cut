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

function SpotifyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
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

  const cardContent = (
    <div
      className={`
        flex gap-4 p-4 rounded-md
        border border-white/[0.08]
        transition-colors duration-200
        ${item.spotifyUrl
          ? "cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.02] active:bg-white/[0.04]"
          : ""
        }
      `}
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
        <div className="flex items-center justify-between mb-1">
          <p className="font-sans text-[0.6rem] tracking-[0.18em] uppercase text-[#C4A265]">
            {item.category}
          </p>
          {item.spotifyUrl && (
            <span className="text-cream-dim/40">
              <SpotifyIcon />
            </span>
          )}
        </div>
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

  if (item.spotifyUrl) {
    return (
      <a
        href={item.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
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
