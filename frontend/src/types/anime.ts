export interface Anime {
  id: string;
  title: string;
  jname: string | null;
  poster: string;
  cover: string | null;
  description: string | null;
  type: string | null;
  status: string | null;
  rating: string | null;
  score: string | null;
  quality: string | null;
  duration: string | null;
  subEpisodes: number | null;
  dubEpisodes: number | null;
  genres: string[];
  aired: string | null;
  premiered: string | null;
  studios: string[];
  producers: string[];
  season: string | null;
  year: string | null;
  popularity: string | null;
  rank: string | null;
}

export interface Episode {
  id: string;
  number: number;
  title: string | null;
  description: string | null;
  image: string | null;
  airDate: string | null;
  isSub: boolean;
  isDub: boolean;
}

export interface ExternalStream {
  title: string;
  url: string;
  site: string;
  thumbnail: string | null;
}

export interface AnimeDetails extends Anime {
  subEpisodesList: Episode[];
  dubEpisodesList: Episode[];
  relatedAnime: Anime[];
  recommendedAnime: Anime[];
  externalStreams?: ExternalStream[];
}

export interface StreamingSource {
  url: string;
  isM3U8: boolean;
  quality: string;
  provider?: string;
}

export interface StreamingServer {
  provider: string;
  label: string;
  url: string;
  isM3U8: boolean;
  quality: string;
  referer?: string;
  intro?: StreamingSkipRange;
  outro?: StreamingSkipRange;
  working: boolean;
}

export interface StreamingSkipRange {
  start: number;
  end: number;
}

export interface StreamingData {
  sources: StreamingSource[];
  download: string;
  headers: Record<string, string>;
  intro?: StreamingSkipRange;
  outro?: StreamingSkipRange;
  subtitles?: Array<{ url?: string; file?: string; label?: string; lang?: string }>;
  servers?: StreamingServer[];
}

export interface Genre {
  id: string;
  name: string;
}

export interface PaginatedAnime {
  anime: Anime[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}