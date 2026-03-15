let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("[Spotify] Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
    return null;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.warn(`[Spotify] Token request failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    // Refresh 60s before expiry to avoid edge cases
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (err) {
    console.warn("[Spotify] Token request error:", err);
    return null;
  }
}

export async function searchSpotifyTrack(
  songTitle: string,
  artistName: string
): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(`track:${songTitle} artist:${artistName}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 429 || res.status >= 500) {
      console.warn(`[Spotify] Search returned ${res.status}`);
      return null;
    }

    if (!res.ok) {
      console.warn(`[Spotify] Search failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const track = data?.tracks?.items?.[0];
    return track?.external_urls?.spotify ?? null;
  } catch (err) {
    console.warn("[Spotify] Search error:", err);
    return null;
  }
}
