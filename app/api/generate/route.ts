import { NextRequest } from "next/server";
import { streamDeepCut } from "@/lib/claude";
import type { SongMatch } from "@/lib/types";

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
        await streamDeepCut(song, (section, content) => {
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
