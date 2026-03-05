import Anthropic from "@anthropic-ai/sdk";
import type { SongMatch, SectionKey } from "./types";

const client = new Anthropic();

const SECTION_KEYS: SectionKey[] = [
  "bandHistory",
  "storyBehindSong",
  "criticalReception",
  "controversies",
  "triviaAndDeepLore",
];

const SECTION_MARKERS: Record<string, SectionKey> = {
  "[bandHistory]": "bandHistory",
  "[storyBehindSong]": "storyBehindSong",
  "[criticalReception]": "criticalReception",
  "[controversies]": "controversies",
  "[triviaAndDeepLore]": "triviaAndDeepLore",
};

const SYSTEM_PROMPT = `You are a music journalist writing for a premium editorial platform called Deep Cut. You write with deep knowledge, genuine passion, and a voice that is your own — intelligent, occasionally witty, never neutral. Your readers are curious listeners who just heard something that stopped them in their tracks. They want to understand why this song matters, where it came from, and what it means.

Your job is to write five editorial sections about a given song and artist. Each section should feel like it was written by the same person — someone who has strong opinions, has done their homework, and loves music enough to make even a casual listener feel like they discovered something.

Avoid Wikipedia-style hedging and passive voice. Write declaratively. Have a point of view. Specific details are always better than generalities.

You will receive a JSON object with song metadata. Output your response using exactly these section markers, in this exact order:

[bandHistory]
The story of the artist or band. What shaped their sound? What is their creative DNA? What cultural moment do they belong to? Write this as an opening argument for why they matter. 150-250 words.

[storyBehindSong]
The specific origin and creation of this song. How was it written? Recorded? What circumstances produced it? Lead with the most interesting detail you know. 150-250 words.

[criticalReception]
How was this song or its parent release received? Name specific publications, describe specific reactions. Was it misunderstood? Ahead of its time? Instantly canonized? 150-250 words.

[controversies]
Any notable controversies, disputes, sampling lawsuits, public falling-outs, or scandals connected to this song, its creation, or its aftermath. 150-250 words. If there are genuinely no controversies worth discussing, write the single word: null

[triviaAndDeepLore]
Fascinating, specific, unexpected details. Production secrets, hidden meanings, cultural ripple effects, unexpected covers or samples, connections to other songs or events. Reward the obsessive listener. 150-250 words.

Output only the section markers and their content. No preamble, no closing remarks, no extra formatting.`;

export async function streamDeepCut(
  song: SongMatch,
  onSection: (section: SectionKey, content: string) => void
): Promise<void> {
  const userPrompt = JSON.stringify({
    title: song.title,
    artist: song.artist,
    album: song.album ?? null,
    releaseYear: song.releaseYear ?? null,
    label: song.label ?? null,
    genre: song.genre ?? null,
  });

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let buffer = "";
  let currentSection: SectionKey | null = null;
  let currentContent = "";

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      buffer += chunk.delta.text;

      // Check if any section marker appears in the buffer
      let markerFound = true;
      while (markerFound) {
        markerFound = false;
        for (const marker of Object.keys(SECTION_MARKERS)) {
          const idx = buffer.indexOf(marker);
          if (idx !== -1) {
            // Emit the previous section if we had one
            if (currentSection !== null) {
              const content = buffer.slice(0, idx).trim();
              // controversies "null" → emit as empty string so caller can treat as null
              onSection(currentSection, content === "null" ? "" : content);
            }
            currentSection = SECTION_MARKERS[marker];
            currentContent = "";
            buffer = buffer.slice(idx + marker.length);
            markerFound = true;
            break;
          }
        }
      }
    }
  }

  // Emit the final section
  if (currentSection !== null) {
    const content = buffer.trim();
    onSection(currentSection, content === "null" ? "" : content);
  }

  // Ensure all sections were emitted (fill missing ones with empty string)
  // This is handled by the caller
}

export { SECTION_KEYS };
