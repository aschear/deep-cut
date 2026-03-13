import type { SongMatch } from "./types";

interface AudDResult {
  status: string;
  result?: {
    artist: string;
    title: string;
    album: string;
    release_date?: string;
    label?: string;
    timecode?: string;
    song_link?: string;
    apple_music?: {
      artwork?: {
        url?: string;
      };
      genreNames?: string[];
    };
    spotify?: {
      album?: {
        images?: { url: string }[];
      };
    };
  } | null;
}

export async function identifyAudio(audioBlob: Blob): Promise<SongMatch | null> {
  const apiKey = process.env.AUDD_API_KEY;

  if (!apiKey) {
    // Local dev mock — return a representative song for testing
    console.warn("[AudD] No AUDD_API_KEY set — returning mock song for development");
    await new Promise((r) => setTimeout(r, 1200)); // simulate latency
    return {
      title: "Night Drive",
      artist: "Dream Division",
      album: "Coastal Frequencies",
      releaseYear: "2021",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
      label: "Cascadia Records",
      genre: "Synth-wave",
    };
  }

  const formData = new FormData();
  formData.append("api_token", apiKey);
  const ext = audioBlob.type.includes("mp4") ? "mp4"
    : audioBlob.type.includes("ogg") ? "ogg"
    : "webm";
  console.log("[AudD] sending audio — type:", audioBlob.type, "size:", audioBlob.size, "ext:", ext);
  formData.append("file", audioBlob, `audio.${ext}`);
  formData.append("return", "apple_music,spotify");

  const response = await fetch("https://api.audd.io/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`AudD HTTP error: ${response.status}`);
  }

  const data: AudDResult = await response.json();

  if (data.status !== "success") {
    // AudD returned an error (e.g. out of credits, invalid key)
    console.error("[AudD] API error response:", JSON.stringify(data));
    throw new Error(`AudD API error: ${JSON.stringify(data)}`);
  }

  if (!data.result) {
    console.log("[AudD] no-match response:", JSON.stringify(data));
    return null;
  }

  const result = data.result;

  // Prefer Apple Music artwork, fall back to Spotify, fall back to nothing
  let imageUrl: string | undefined;
  if (result.apple_music?.artwork?.url) {
    // AudD returns {w}x{h} placeholders in the URL
    imageUrl = result.apple_music.artwork.url
      .replace("{w}", "800")
      .replace("{h}", "800");
  } else if (result.spotify?.album?.images?.[0]?.url) {
    imageUrl = result.spotify.album.images[0].url;
  }

  // Fallback: iTunes Search API (free, no key required)
  if (!imageUrl) {
    imageUrl = await fetchItunesArtwork(result.title, result.artist);
  }

  const genre = result.apple_music?.genreNames?.[0];

  const releaseYear = result.release_date
    ? new Date(result.release_date).getFullYear().toString()
    : undefined;

  return {
    title: result.title,
    artist: result.artist,
    album: result.album || undefined,
    releaseYear,
    imageUrl,
    label: result.label || undefined,
    genre,
  };
}

async function fetchItunesArtwork(
  title: string,
  artist: string
): Promise<string | undefined> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);

    // Use Promise.race for timeout — more compatible than AbortSignal.timeout()
    const fetchPromise = fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5`,
      { cache: "no-store" }
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("iTunes fetch timed out")), 3000)
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    if (!res.ok) {
      console.warn(`[iTunes] Non-ok response: ${res.status}`);
      return undefined;
    }

    const data = await res.json();
    const artworkUrl: unknown = data?.results?.[0]?.artworkUrl100;
    if (typeof artworkUrl !== "string" || !artworkUrl) return undefined;

    // Replace any NxNbb size token with 600x600bb — resilient to format variants
    return artworkUrl.replace(/\d+x\d+bb/, "600x600bb");
  } catch (err) {
    console.warn("[iTunes] Artwork fetch failed:", err);
    return undefined; // non-fatal — page still renders without art
  }
}
