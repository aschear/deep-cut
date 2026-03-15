export interface SongMatch {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: string;
  imageUrl?: string;
  label?: string;
  genre?: string;
}

export interface DigDeeperItem {
  category: "Key Influences" | "In Conversation" | "Surprising Connections";
  songTitle: string;
  artistName: string;
  explanation: string;
  spotifyUrl?: string;
}

export interface DeepCutContent {
  bandHistory: string;
  storyBehindSong: string;
  criticalReception: string;
  controversies: string | null;
  triviaAndDeepLore: string;
  digDeeper?: DigDeeperItem[];
}

export type SectionKey = keyof DeepCutContent;

export interface SectionEvent {
  section: SectionKey;
  content: string;
}

export interface DeepCutResult {
  song: SongMatch;
  content?: DeepCutContent;
}

// API response shapes
export interface IdentifyResponse {
  success: true;
  song: SongMatch;
}

export interface IdentifyError {
  success: false;
  error: "no_match" | "api_error" | "invalid_audio";
  message: string;
}

export interface GenerateResponse {
  success: true;
  content: DeepCutContent;
}

export interface GenerateError {
  success: false;
  error: "generation_failed" | "parse_error" | "api_error";
  message: string;
}
