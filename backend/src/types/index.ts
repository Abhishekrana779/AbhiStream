export interface MiruroAnimeTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface MiruroCoverImage {
  large?: string | null;
  medium?: string | null;
  extraLarge?: string | null;
}

export interface MiruroStudio {
  id?: number;
  name?: string;
  isAnimationStudio?: boolean;
}

export interface MiruroAnimeItem {
  id: number;

  idMal?: number | null;

  title: MiruroAnimeTitle;

  coverImage?: MiruroCoverImage | null;

  bannerImage?: string | null;

  description?: string | null;

  format?: string | null;

  season?: string | null;

  seasonYear?: number | null;

  episodes?: number | null;

  duration?: number | null;

  status?: string | null;

  averageScore?: number | null;

  meanScore?: number | null;

  popularity?: number | null;

  favourites?: number | null;

  genres?: string[];

  studios?: { nodes?: MiruroStudio[] } | MiruroStudio[];

  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;

  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
}

export interface MiruroListResponse {
  page: number;
  perPage: number;
  total: number;
  hasNextPage: boolean;
  results: MiruroAnimeItem[];
}

export interface MiruroAnimeDetail extends MiruroAnimeItem {
  relations?: {
    edges?: Array<{
      node?: MiruroAnimeItem;
      relationType?: string;
    }>;
  };
  recommendations?: {
    nodes?: Array<{
      mediaRecommendation?: MiruroAnimeItem;
      rating?: number;
    }>;
  };
  streamingEpisodes?: Array<{
    title?: string | null;
    thumbnail?: string | null;
    url?: string;
    site?: string | null;
  }>;
  nextAiringEpisode?: {
    episode?: number | null;
    airingAt?: number | null;
    timeUntilAiring?: number | null;
  } | null;
  stats?: {
    scoreDistribution?: Array<{ score: number; amount: number }>;
    statusDistribution?: Array<{ status: string; amount: number }>;
  };
}

export interface MiruroAnimeInfoResponse {
  success: boolean;
  results: MiruroAnimeDetail;
  creator?: string;
  github?: string;
  telegram?: string;
  timestamp?: string;
}

export interface ExternalStream {
  title: string;
  url: string;
  site: string;
  thumbnail: string | null;
}

export interface MiruroEpisodeItem {
  id: string;
  number: number;
  title: string | null;
  description: string | null;
  image: string | null;
  airDate: string | null;
  duration?: number | null;
  filler?: boolean | null;
}

export interface MiruroStreamSource {
  url: string;
  type?: string;
  quality?: string;
  isM3U8?: boolean;
  referer?: string;
  server?: string;
  default?: boolean;
  isActive?: boolean;
}

export interface MiruroWatchResponse {
  streams?: MiruroStreamSource[];
  sources?: Array<{
    url: string;
    isM3U8: boolean;
    quality: string;
  }>;
  download?: string;
  headers?: Record<string, string>;
}

export interface MiruroEpisodesResponse {
  mappings?: Record<string, unknown>;
  providers?: Record<
    string,
    {
      episodes?: {
        sub?: MiruroEpisodeItem[];
        dub?: MiruroEpisodeItem[];
      };
    }
  >;
}

export interface MiruroGenreItem {
  id: string;
  name: string;
}

export interface MiruroGenresResponse {
  results: string[];
}

export interface MiruroSpotlightResponse {
  results: MiruroAnimeItem[];
}

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

export interface AnimeDetails extends Anime {
  subEpisodesList: Episode[];
  dubEpisodesList: Episode[];
  relatedAnime: Anime[];
  recommendedAnime: Anime[];
  externalStreams: ExternalStream[];
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

export interface StreamingSource {
  url: string;
  isM3U8: boolean;
  quality: string;
  provider?: string;
}

export interface StreamingData {
  sources: StreamingSource[];
  download: string;
  headers: Record<string, string>;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  subtitles?: Array<{ url?: string; file?: string; label?: string; lang?: string }>;
  servers?: Array<{
    provider: string;
    label: string;
    url: string;
    isM3U8: boolean;
    quality: string;
    referer?: string;
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
    working: boolean;
  }>;
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

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistDocument {
  _id: string;
  userId: string;
  animeId: string;
  title: string;
  poster: string;
  status: string | null;
  addedAt: Date;
}

export interface HistoryDocument {
  _id: string;
  userId: string;
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string | null;
  poster: string;
  progress: number;
  duration: number;
  completed: boolean;
  watchedAt: Date;
}
