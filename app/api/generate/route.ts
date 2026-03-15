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
                const enriched = await Promise.all(
                  items.map(async (item) => {
                    const spotifyUrl = await searchSpotifyTrack(item.songTitle, item.artistName);
                    return spotifyUrl ? { ...item, spotifyUrl } : item;
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
