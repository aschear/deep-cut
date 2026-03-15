import { NextRequest } from "next/server";
import { streamDeepCut } from "@/lib/claude";
import { searchSpotifyTrack } from "@/lib/spotify";
import type { SongMatch, DigDeeperItem } from "@/lib/types";

export const maxDuration = 60; // allow up to 60s for Claude streaming on Vercel

export async function POST(request: NextRequest) {
  let song: SongMatch;
  try {
    song = await request.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ error: "Invalid request body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  if (!song?.title || !song?.artist) {
    return new Response(
      `data: ${JSON.stringify({ error: "Song title and artist are required" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamDeepCut(song, async (section, content) => {
          if (section === "digDeeper" && content) {
            // Enrich with Spotify URLs before emitting
            try {
              const items: DigDeeperItem[] = JSON.parse(content);
              if (Array.isArray(items)) {
                // Validate: each item must have non-empty basis, songTitle, artistName, category, explanation
                const valid = items.filter((item) => {
                  if (!item.songTitle || !item.artistName || !item.category || !item.explanation) {
                    console.warn("[Dig Deeper QA] Dropped item missing required fields:", item);
                    return false;
                  }
                  if (!item.basis || item.basis.trim().length === 0) {
                    console.warn(`[Dig Deeper QA] Dropped item with empty basis: "${item.songTitle}" by ${item.artistName}`);
                    return false;
                  }
                  return true;
                });

                // QA logging
                for (const item of valid) {
                  console.log(`[Dig Deeper QA] ${item.category}: "${item.songTitle}" by ${item.artistName} / Basis: ${item.basis}`);
                }

                // Skip section entirely if no valid items remain
                if (valid.length === 0) {
                  console.warn("[Dig Deeper QA] All items failed validation, skipping section");
                  return;
                }

                // Enrich with Spotify URLs
                const enriched = await Promise.all(
                  valid.map(async (item) => {
                    const spotifyUrl = await searchSpotifyTrack(item.songTitle, item.artistName);
                    // Strip basis before sending to client (internal field only)
                    const { basis, ...clientItem } = item;
                    return spotifyUrl ? { ...clientItem, spotifyUrl } : clientItem;
                  })
                );
                const event = `data: ${JSON.stringify({ section, content: JSON.stringify(enriched) })}\n\n`;
                controller.enqueue(encoder.encode(event));
                return;
              }
            } catch { /* fall through to emit raw content */ }
          }
          const event = `data: ${JSON.stringify({ section, content })}\n\n`;
          controller.enqueue(encoder.encode(event));
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (err) {
        console.error("[/api/generate] stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Generation failed. Try again." })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
