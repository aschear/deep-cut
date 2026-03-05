import Anthropic from "@anthropic-ai/sdk";
import type { SongMatch, DeepCutContent } from "./types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a music journalist writing for a premium editorial platform called Deep Cut. You write with deep knowledge, genuine passion, and a voice that is your own — intelligent, occasionally witty, never neutral. Your readers are curious listeners who just heard something that stopped them in their tracks. They want to understand why this song matters, where it came from, and what it means.

Your job is to write five editorial sections about a given song and artist. Each section should feel like it was written by the same person — someone who has strong opinions, has done their homework, and loves music enough to make even a casual listener feel like they discovered something.

Avoid Wikipedia-style hedging and passive voice. Write declaratively. Have a point of view. Specific details are always better than generalities.

You will receive a JSON object with song metadata. Return a JSON object with exactly these keys:

- bandHistory: The story of the artist or band. What shaped their sound? What is their creative DNA? What cultural moment do they belong to? Write this as an opening argument for why they matter. 150-250 words.

- storyBehindSong: The specific origin and creation of this song. How was it written? Recorded? What circumstances produced it? Lead with the most interesting detail you know. 150-250 words.

- criticalReception: How was this song or its parent release received? Name specific publications, describe specific reactions. Was it misunderstood? Ahead of its time? Instantly canonized? 150-250 words.

- controversies: Any notable controversies, disputes, sampling lawsuits, public falling-outs, or scandals connected to this song, its creation, or its aftermath. 150-250 words. If there are genuinely no controversies worth discussing, return null for this field — do not invent them or fill the space with minor non-events.

- triviaAndDeepLore: Fascinating, specific, unexpected details. Production secrets, hidden meanings, cultural ripple effects, unexpected covers or samples, connections to other songs or events. Reward the obsessive listener. 150-250 words.

Return only valid JSON. No preamble. No markdown formatting. No code blocks. No explanation. Just the raw JSON object starting with { and ending with }.`;

export async function generateDeepCut(song: SongMatch): Promise<DeepCutContent> {
  const userPrompt = JSON.stringify({
    title: song.title,
    artist: song.artist,
    album: song.album ?? null,
    releaseYear: song.releaseYear ?? null,
    label: song.label ?? null,
    genre: song.genre ?? null,
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const rawText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // Strip any accidental markdown code fences
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse failed. Raw response: ${cleaned.slice(0, 200)}`);
  }

  return validateDeepCutContent(parsed);
}

function validateDeepCutContent(raw: unknown): DeepCutContent {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Response is not an object");
  }

  const obj = raw as Record<string, unknown>;
  const required: Array<keyof DeepCutContent> = [
    "bandHistory",
    "storyBehindSong",
    "criticalReception",
    "triviaAndDeepLore",
  ];

  for (const key of required) {
    if (typeof obj[key] !== "string" || (obj[key] as string).trim() === "") {
      throw new Error(`Missing or empty required field: ${key}`);
    }
  }

  // controversies can be string or null
  const controversies =
    obj.controversies === null || obj.controversies === undefined
      ? null
      : typeof obj.controversies === "string"
      ? obj.controversies.trim() || null
      : null;

  return {
    bandHistory: (obj.bandHistory as string).trim(),
    storyBehindSong: (obj.storyBehindSong as string).trim(),
    criticalReception: (obj.criticalReception as string).trim(),
    controversies,
    triviaAndDeepLore: (obj.triviaAndDeepLore as string).trim(),
  };
}
