import { NextRequest, NextResponse } from "next/server";
import { identifyAudio } from "@/lib/audd";
import type { IdentifyResponse, IdentifyError } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    console.log("[identify] audio received — type:", (audioFile as Blob)?.type, "size:", (audioFile as Blob)?.size);

    if (!audioFile || !(audioFile instanceof Blob)) {
      const error: IdentifyError = {
        success: false,
        error: "invalid_audio",
        message: "No audio data received.",
      };
      return NextResponse.json(error, { status: 400 });
    }

    const song = await identifyAudio(audioFile);

    if (!song) {
      const error: IdentifyError = {
        success: false,
        error: "no_match",
        message:
          "Want to try that one again?",
      };
      return NextResponse.json(error, { status: 404 });
    }

    const response: IdentifyResponse = { success: true, song };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/identify] error:", err);
    const error: IdentifyError = {
      success: false,
      error: "api_error",
      message: "Something went wrong on our end. Give it another try.",
    };
    return NextResponse.json(error, { status: 500 });
  }
}
