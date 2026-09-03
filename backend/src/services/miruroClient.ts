import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { cache } from "./cacheService";
import type {
  Anime,
  AnimeDetails,
  Episode,
  ExternalStream,
  Genre,
  PaginatedAnime,
  StreamingData,
  StreamingSource,
} from "../types";

const anilist: AxiosInstance = axios.create({
  baseURL: "https://graphql.anilist.co",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const ANILIST_FALLBACK_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Hentai",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

interface AniListTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

interface AniListCoverImage {
  large?: string | null;
  medium?: string | null;
  extraLarge?: string | null;
  color?: string | null;
}

interface AniListFuzzyDate {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

interface AniListStudioNode {
  node?: { id: number; name: string; isAnimationStudio?: boolean };
}

interface AniListMediaEdge {
  node?: AniListMedia;
  relationType?: string;
}

interface AniListRecommendation {
  mediaRecommendation?: AniListMedia;
}

interface AniListStreamingEpisode {
  title?: string | null;
  thumbnail?: string | null;
  url?: string | null;
  site?: string | null;
}

interface AniListAiring {
  episode?: number | null;
  airingAt?: number | null;
  timeUntilAiring?: number | null;
}

interface AniListMedia {
  id: number;
  idMal?: number | null;
  title?: AniListTitle | null;
  description?: string | null;
  format?: string | null;
  status?: string | null;
  episodes?: number | null;
  duration?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  genres?: string[] | null;
  bannerImage?: string | null;
  coverImage?: AniListCoverImage | null;
  startDate?: AniListFuzzyDate | null;
  endDate?: AniListFuzzyDate | null;
  season?: string | null;
  seasonYear?: number | null;
  studios?: { edges?: AniListStudioNode[] } | null;
  relations?: { edges?: AniListMediaEdge[] } | null;
  recommendations?: { nodes?: AniListRecommendation[] } | null;
  streamingEpisodes?: AniListStreamingEpisode[] | null;
  nextAiringEpisode?: AniListAiring | null;
  trailer?: { id?: string | null; site?: string | null } | null;
}

interface AniListPage {
  pageInfo: { currentPage: number; hasNextPage: boolean; lastPage: number; total: number; perPage: number };
  media?: AniListMedia[] | null;
}

interface AniListResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const { data } = await anilist.post<AniListResponse<T>>("", {
    query,
    variables,
  });
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
  }
  if (!data.data) {
    throw new Error("AniList returned no data");
  }
  return data.data;
}

const MEDIA_FIELDS = `
  id idMal
  title { romaji english native userPreferred }
  description(asHtml: false)
  format status episodes duration
  averageScore meanScore popularity favourites
  genres
  bannerImage
  coverImage { large medium extraLarge color }
  startDate { year month day }
  endDate { year month day }
  season seasonYear
  studios { edges { node { id name isAnimationStudio } } }
  streamingEpisodes { title thumbnail url site }
  trailer { id site }
`;

const FULL_MEDIA_FIELDS = `
  ${MEDIA_FIELDS}
  relations { edges { node { ${MEDIA_FIELDS} } relationType } }
  recommendations(perPage: 12) { nodes { mediaRecommendation { ${MEDIA_FIELDS} } } }
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const POPULAR_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const UPCOMING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const LATEST_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, sort: START_DATE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, search: $search, sort: SEARCH_MATCH, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const GENRE_QUERY = `
  query ($genre: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const SPOTLIGHT_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total perPage }
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} }
    }
  }
`;

const INFO_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) { ${FULL_MEDIA_FIELDS} }
  }
`;

const EPISODES_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      episodes
      streamingEpisodes { title thumbnail url site }
    }
  }
`;

function joinFuzzyDate(d: AniListFuzzyDate | null | undefined): string | null {
  if (!d) return null;
  const y = d.year ?? "";
  const m = d.month ? String(d.month).padStart(2, "0") : "";
  const day = d.day ? String(d.day).padStart(2, "0") : "";
  const out = [y, m, day].filter(Boolean).join("-");
  return out || null;
}

function pickTitle(t?: AniListTitle | null): string {
  if (!t) return "Unknown Title";
  return t.english || t.userPreferred || t.romaji || t.native || "Unknown Title";
}

function pickPoster(c?: AniListCoverImage | null): string {
  return c?.extraLarge || c?.large || c?.medium || "";
}

function formatStatus(s?: string | null): string | null {
  if (!s) return null;
  return s
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFormat(f?: string | null): string | null {
  if (!f) return null;
  return f.replace("_", " ");
}

function pickStudios(m: AniListMedia): string[] {
  const edges = m.studios?.edges || [];
  const names = edges
    .map((e) => e?.node?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
  if (names.length > 0) return names;
  return [];
}

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    anikoto: "AniKoto",
    hianime: "AbhiStream",
    anineko: "AniNeko",
    animegg: "AnimeGG",
    reanime: "ReAnime",
    external: "External",
  };
  return map[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

function normalizeAnime(m: AniListMedia): Anime {
  const poster = pickPoster(m.coverImage);
  return {
    id: String(m.id),
    title: pickTitle(m.title),
    jname: m.title?.native ?? null,
    poster,
    cover: m.bannerImage || null,
    description: m.description || null,
    type: formatFormat(m.format),
    status: formatStatus(m.status),
    rating: null,
    score: m.averageScore ? String((m.averageScore / 10).toFixed(2)) : null,
    quality: null,
    duration: m.duration ? String(m.duration) : null,
    subEpisodes: m.episodes ?? null,
    dubEpisodes: null,
    genres: m.genres || [],
    aired: joinFuzzyDate(m.startDate),
    premiered: m.season ? `${m.season} ${m.seasonYear ?? ""}`.trim() : null,
    studios: pickStudios(m),
    producers: [],
    season: m.season || null,
    year: m.seasonYear ? String(m.seasonYear) : null,
    popularity: m.popularity ? String(m.popularity) : null,
    rank: null,
  };
}

function normalizeListPage(page: AniListPage): PaginatedAnime {
  const media = page.media || [];
  return {
    anime: media.map(normalizeAnime),
    currentPage: page.pageInfo.currentPage,
    totalPages: page.pageInfo.lastPage,
    totalResults: page.pageInfo.total,
    hasNextPage: page.pageInfo.hasNextPage,
  };
}

function normalizeExternalStreams(m: AniListMedia): ExternalStream[] {
  return (m.streamingEpisodes || []).map((se) => ({
    title: se?.title ?? "",
    url: se?.url ?? "",
    site: se?.site ?? "",
    thumbnail: se?.thumbnail ?? null,
  }));
}

function makeEpisodeId(anilistId: string, number: number): string {
  return `${anilistId}:${number}`;
}

function buildEpisodesFromAniList(
  anilistId: string,
  totalEpisodes: number | null | undefined,
  streaming: AniListStreamingEpisode[] | null | undefined,
): { sub: Episode[]; dub: Episode[] } {
  const total = totalEpisodes ?? streaming?.length ?? 0;
  const sub: Episode[] = [];
  for (let i = 1; i <= total; i++) {
    const stream = (streaming || []).find((s) => {
      const m = /episode-?(\d+)/i.exec(s?.url || "");
      return m && Number(m[1]) === i;
    });
    sub.push({
      id: makeEpisodeId(anilistId, i),
      number: i,
      title: stream?.title ?? `Episode ${i}`,
      description: null,
      image: stream?.thumbnail ?? null,
      airDate: null,
      isSub: true,
      isDub: false,
    });
  }
  return { sub, dub: [] };
}

async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(cacheKey);
  if (cached) return cached;
  const data = await fetcher();
  cache.set(cacheKey, data);
  return data;
}

export const miruroClient = {
  async getTrending(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:trending:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(TRENDING_QUERY, {
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async getPopular(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:popular:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(POPULAR_QUERY, {
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async getLatest(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:latest:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(LATEST_QUERY, {
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async getUpcoming(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:upcoming:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(UPCOMING_QUERY, {
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async searchAnime(query: string, page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:search:${query}:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(SEARCH_QUERY, {
        search: query,
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async getAnimeInfo(id: string): Promise<AnimeDetails> {
    return fetchWithCache(`anilist:info:${id}`, async () => {
      const anilistId = Number.parseInt(id, 10);
      if (Number.isNaN(anilistId)) {
        throw new Error("Invalid anime id");
      }
      const data = await gql<{ Media: AniListMedia }>(INFO_QUERY, {
        id: anilistId,
      });
      const raw = data.Media;
      const base = normalizeAnime(raw);

      const { sub, dub } = buildEpisodesFromAniList(
        String(anilistId),
        raw.episodes,
        raw.streamingEpisodes || [],
      );

      const currentId = String(anilistId);
      const seen = new Set<string>();
      const dedupe = (a: Anime | null): Anime | null => {
        if (!a) return null;
        if (a.id === currentId) return null;
        if (seen.has(a.id)) return null;
        seen.add(a.id);
        return a;
      };

      const relatedAnime = (raw.relations?.edges || [])
        .map((edge) => (edge?.node ? normalizeAnime(edge.node) : null))
        .map(dedupe)
        .filter(Boolean) as Anime[];

      const recommendedAnime = (raw.recommendations?.nodes || [])
        .map((n) =>
          n?.mediaRecommendation ? normalizeAnime(n.mediaRecommendation) : null,
        )
        .map(dedupe)
        .filter(Boolean) as Anime[];

      return {
        ...base,
        subEpisodesList: sub,
        dubEpisodesList: dub,
        relatedAnime,
        recommendedAnime,
        externalStreams: normalizeExternalStreams(raw),
      };
    });
  },

  async getStreamingSources(_episodeId: string): Promise<StreamingData> {
    return {
      sources: [],
      download: "",
      headers: {},
      intro: undefined,
      outro: undefined,
      subtitles: [],
    };
  },

  async getEpisodeLinks(
    anilistId: string,
    episodeNumber: number,
    category: "sub" | "dub" = "sub",
  ): Promise<StreamingData> {
    return fetchWithCache(`anilist:episode:${category}:${anilistId}:${episodeNumber}`, async () => {
      const empty: StreamingData = {
        sources: [],
        download: "",
        headers: {},
        intro: undefined,
        outro: undefined,
        subtitles: [],
        servers: [],
      };

      if (!env.STREAM_API_URL) {
        const { data } = await anilist.post<AniListResponse<{ Media: AniListMedia }>>("", {
          query: EPISODES_QUERY,
          variables: { id: Number.parseInt(anilistId, 10) },
        });
        if (data.errors && data.errors.length > 0) return empty;
        const streams = (data.data?.Media.streamingEpisodes || []).filter(
          (s) => /episode-?(\d+)/i.test(s?.url || ""),
        );
        const match = streams.find((s) => {
          const m = /episode-?(\d+)/i.exec(s?.url || "");
          return m && Number(m[1]) === episodeNumber;
        });
        if (!match || !match.url) return empty;
        return {
          sources: [{ url: match.url, isM3U8: false, quality: match.site || "external", provider: "external" }],
          download: "",
          headers: {},
          intro: undefined,
          outro: undefined,
          subtitles: [],
          servers: [
            {
              provider: "external",
              label: match.site || "External",
              url: match.url,
              isM3U8: false,
              quality: match.site || "external",
              working: true,
            },
          ],
        };
      }

      const base = env.STREAM_API_URL.replace(/\/$/, "");
      const providers = ["anikoto", "hianime", "anineko", "animegg", "reanime"];

      const results = await Promise.allSettled(
        providers.map(async (provider) => {
          const url = `${base}/watch/${provider}/${anilistId}/${category}/${provider}-${episodeNumber}`;
          const { data } = await axios.get<any>(url, { timeout: 20000 });
          if (!data || typeof data !== "object") return null;

          // Standard Anivexa shape: { ssub: { streams, intro, outro }, sdub: {...} }
          let container: {
            streams?: Array<{ url: string; type?: string; referer?: string }>;
            intro?: { start: number; end: number };
            outro?: { start: number; end: number };
            subtitles?: Array<{ url?: string; file?: string; label?: string; lang?: string }>;
          } | null = null;
          if (category === "dub") {
            container = data?.sdub || data?.dub || null;
          } else {
            container = data?.ssub || data?.sub || null;
          }

          // Alternative shape (e.g. animegg): { streams: [...], title, ... }
          if (!container && Array.isArray(data?.streams)) {
            container = {
              streams: data.streams,
              intro: data.intro,
              outro: data.outro,
              subtitles: data.subtitles,
            };
          }

          const streams = container?.streams || [];
          const hls = streams.find((s) => s.type === "hls" || /\.m3u8($|\?)/i.test(s.url));
          const chosen = hls || streams[0];
          if (!chosen?.url) return null;
          return {
            provider,
            label: providerLabel(provider),
            url: chosen.url,
            isM3U8: /\.m3u8($|\?)/i.test(chosen.url),
            quality: provider,
            referer: chosen.referer,
            intro: container?.intro,
            outro: container?.outro,
            subtitles: container?.subtitles || [],
          };
        }),
      );

      const servers = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .map((s) => ({ ...s, working: true }));

      if (servers.length === 0) {
        return empty;
      }

      // Pick the first working provider (preferring anikoto > hianime > others).
      const order = ["anikoto", "hianime", "anineko", "animegg", "reanime"];
      const primary = order
        .map((p) => servers.find((s) => s.provider === p))
        .find(Boolean) || servers[0];

      return {
        sources: [
          {
            url: primary.url,
            isM3U8: primary.isM3U8,
            quality: primary.quality,
            provider: primary.provider,
          },
        ],
        download: "",
        headers: primary.referer ? { Referer: primary.referer } : {},
        intro: primary.intro,
        outro: primary.outro,
        subtitles: primary.subtitles,
        servers,
      };
    });
  },

  async getGenres(): Promise<Genre[]> {
    return fetchWithCache("anilist:genres", async () => {
      return ANILIST_FALLBACK_GENRES.map((g) => ({ id: g, name: g }));
    });
  },

  async getGenreAnime(genreId: string, page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`anilist:genre:${genreId}:${page}`, async () => {
      const data = await gql<{ Page: AniListPage }>(GENRE_QUERY, {
        genre: genreId,
        page,
        perPage: 20,
      });
      return normalizeListPage(data.Page);
    });
  },

  async getSpotlight(): Promise<Anime | null> {
    return fetchWithCache("anilist:spotlight", async () => {
      const data = await gql<{ Page: AniListPage }>(SPOTLIGHT_QUERY, {
        page: 1,
        perPage: 1,
      });
      const first = (data.Page.media || [])[0];
      return first ? normalizeAnime(first) : null;
    });
  },
};