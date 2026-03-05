import { NextRequest, NextResponse } from "next/server";
import { generateDeepCut } from "@/lib/claude";
import type { SongMatch, GenerateResponse, GenerateError } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const song = body as SongMatch;

    if (!song?.title || !song?.artist) {
      const error: GenerateError = {
        success: false,
        error: "generation_failed",
        message: "Song title and artist are required.",
      };
      return NextResponse.json(error, { status: 400 });
    }

    const content = await generateDeepCut(song);

    const response: GenerateResponse = { success: true, content };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/generate] error:", err);

    const isParseError =
      err instanceof Error && err.message.includes("JSON parse failed");

    const error: GenerateError = {
      success: false,
      error: isParseError ? "parse_error" : "api_error",
      message: isParseError
        ? "The archive returned something we couldn't read. Try again."
        : "We couldn't pull the story on this one. Try again in a moment.",
    };
    return NextResponse.json(error, { status: 500 });
  }
}
