/**
 * Search result types
 */
export interface TorrentFile {
  id: string;
  title: string;
  size: string;
  seeders: number;
  leechers: number;
  magnet: string;
  source: string;
  date?: string;
  uploader?: string;
}

export interface SearchOptions {
  query: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface TrackerConfig {
  name: string;
  baseUrl: string;
  searchPath: string;
  enabled: boolean;
  requiresProxy: boolean;
}
