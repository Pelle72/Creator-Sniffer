
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  uri: string;
  title: string;
  thumbnailUrl?: string;
}

export type SearchType = 'creator' | 'work';

export type ApiProvider = 'gemini' | 'grok';

export interface ImagePayload {
  mimeType: string;
  data: string; // base64 encoded string
}
