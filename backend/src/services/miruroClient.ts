import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { cache } from "./cacheService";
import type {
  MiruroAnimeItem,
  MiruroAnimeDetail,
  MiruroEpisodeItem,
  MiruroListResponse,
  MiruroEpisodesResponse,
  MiruroWatchResponse,
  MiruroGenresResponse,
  MiruroSpotlightResponse,
  Anime,
  AnimeDetails,
  Episode,
  StreamingData,
  Genre,
  ExternalStream,
  PaginatedAnime,
} from "../types";

const client: AxiosInstance = axios.create({
  baseURL: env.MIRURO_API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

function resolveStudios(item: MiruroAnimeItem): string[] {
  const studios = item.studios;
  if (Array.isArray(studios)) {
    return studios.map((s) => s?.name ?? "").filter(Boolean);
  }
  const nodes = (studios as { nodes?: MiruroAnimeItem["studios"] })
    ?.nodes;
  return Array.isArray(nodes)
    ? nodes.map((s) => s?.name ?? "").filter(Boolean)
    : [];
}

function normalizeAnime(item: MiruroAnimeItem): Anime {
  const titleStr =
    typeof item.title === "string"
      ? item.title
      : item.title?.english || item.title?.romaji || "Unknown Title";
  const poster =
    typeof item.coverImage === "string"
      ? item.coverImage
      : item.coverImage?.large || item.coverImage?.medium || "";
  const airedDate = item.startDate
    ? `${item.startDate.year || ""}-${item.startDate.month || ""}-${item.startDate.day || ""}`
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    : null;

  return {
    id: String(item.id),
    title: titleStr,
    jname: null,
    poster: poster,
    cover: item.bannerImage || null,
    description: item.description || null,
    type: item.format || null,
    status: item.status || null,
    rating: null,
    score: item.averageScore ? String(item.averageScore) : null,
    quality: null,
    duration: item.duration ? String(item.duration) : null,
    subEpisodes: item.episodes || null,
    dubEpisodes: null,
    genres: item.genres || [],
    aired: airedDate,
    premiered: null,
    studios: resolveStudios(item),
    producers: [],
    season: item.season || null,
    year: item.seasonYear ? String(item.seasonYear) : null,
    popularity: item.popularity ? String(item.popularity) : null,
    rank: null,
  };
}

function normalizeEpisode(ep: MiruroEpisodeItem, isSub: boolean): Episode {
  return {
    id: normalizeWatchId(ep.id),
    number: ep.number,
    title: ep.title || null,
    description: ep.description || null,
    image: ep.image || null,
    airDate: ep.airDate || null,
    isSub,
    isDub: !isSub,
  };
}

function normalizeWatchId(rawId: string): string {
  return String(rawId).replace(/^\/?watch\//, "").replace(/\//g, ":");
}

function toWatchPath(episodeId: string): string {
  return "/watch/" + episodeId.split(":").join("/");
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPageObject(body: unknown): MiruroListResponse {
  const b =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const r = b.results;
  if (Array.isArray(r)) {
    return {
      page: toNumber(b.page) ?? 1,
      perPage: toNumber(b.perPage) ?? (r.length > 0 ? 20 : 0),
      total: toNumber(b.total) ?? r.length,
      hasNextPage: !!b.hasNextPage,
      results: r as MiruroAnimeItem[],
    };
  }
  if (r && typeof r === "object" && Array.isArray((r as any).results)) {
    return r as unknown as MiruroListResponse;
  }
  if (r && typeof r === "object" && !Array.isArray(r)) {
    return r as unknown as MiruroListResponse;
  }
  return b as unknown as MiruroListResponse;
}

function toAnimeObject(body: unknown): MiruroAnimeDetail {
  const b =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const r = b.results;
  if (
    r &&
    typeof r === "object" &&
    !Array.isArray(r) &&
    (typeof (r as any).id !== "undefined" || typeof (r as any).title !== "undefined")
  ) {
    return r as unknown as MiruroAnimeDetail;
  }
  return b as unknown as MiruroAnimeDetail;
}

function toItemArray(body: unknown): MiruroAnimeItem[] {
  const b =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (Array.isArray(b.results)) return b.results as MiruroAnimeItem[];
  if (Array.isArray(b)) return b as MiruroAnimeItem[];
  return [];
}

function normalizeListPage(res: MiruroListResponse): PaginatedAnime {
  const total = res.total || 0;
  const perPage = res.perPage || 0;
  return {
    anime: (res.results || []).map(normalizeAnime),
    currentPage: res.page || 1,
    totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1,
    totalResults: total,
    hasNextPage: res.hasNextPage || false,
  };
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

async function fetchEpisodes(
  anilistId: string,
): Promise<{ sub: Episode[]; dub: Episode[] }> {
  const { data } = await client.get<MiruroEpisodesResponse>(
    `/episodes/${anilistId}`,
  );
  const providers = data.providers || {};
  const providerKeys = Object.keys(providers);
  if (providerKeys.length === 0) return { sub: [], dub: [] };

  const withSub = providerKeys.find(
    (k) => providers[k]?.episodes?.sub && providers[k].episodes.sub.length > 0,
  );
  const providerName = withSub || providerKeys[0];
  const episodes = providers[providerName]?.episodes;
  const sub = (episodes?.sub || []).map((ep) => normalizeEpisode(ep, true));
  const dub = (episodes?.dub || []).map((ep) => normalizeEpisode(ep, false));
  return { sub, dub };
}

function normalizeExternalStreams(
  detail: MiruroAnimeDetail,
): ExternalStream[] {
  return (detail.streamingEpisodes || []).map((se) => ({
    title: se?.title ?? "",
    url: se?.url ?? "",
    site: se?.site ?? "",
    thumbnail: se?.thumbnail ?? null,
  }));
}

const FALLBACK_GENRES: string[] = [
  "Action",
  "Adventure",
  "Cars",
  "Comedy",
  "Cyberpunk",
  "Dementia",
  "Demons",
  "Drama",
  "Fantasy",
  "Game",
  "Historical",
  "Horror",
  "Kids",
  "Magic",
  "Mecha",
  "Music",
  "Mystery",
  "Parody",
  "Police",
  "Psychological",
  "Romance",
  "School",
  "Sci-Fi",
  "Shoujo",
  "Shounen",
  "Slice of Life",
  "Space",
  "Sports",
  "Supernatural",
  "Martial Arts",
  "Military",
  "Vampire",
  "Yaoi",
  "Yuri",
  "Isekai",
  "Super Power",
];

export const miruroClient = {
  async getTrending(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`trending:${page}`, async () => {
      const { data } = await client.get("/trending", { params: { page } });
      return normalizeListPage(toPageObject(data));
    });
  },

  async getPopular(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`popular:${page}`, async () => {
      const { data } = await client.get("/popular", { params: { page } });
      return normalizeListPage(toPageObject(data));
    });
  },

  async getLatest(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`latest:${page}`, async () => {
      const { data } = await client.get("/recent", { params: { page } });
      return normalizeListPage(toPageObject(data));
    });
  },

  async getUpcoming(page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`upcoming:${page}`, async () => {
      const { data } = await client.get("/upcoming", { params: { page } });
      return normalizeListPage(toPageObject(data));
    });
  },

  async searchAnime(query: string, page: number = 1): Promise<PaginatedAnime> {
    return fetchWithCache(`search:${query}:${page}`, async () => {
      const { data } = await client.get("/search", {
        params: { query, page },
      });
      return normalizeListPage(toPageObject(data));
    });
  },

  async getAnimeInfo(id: string): Promise<AnimeDetails> {
    return fetchWithCache(`anime:${id}`, async () => {
      const { data } = await client.get(`/info/${id}`);
      const raw = toAnimeObject(data);

      const base = normalizeAnime(raw);

      let subEpisodesList: Episode[] = [];
      let dubEpisodesList: Episode[] = [];
      try {
        const episodes = await fetchEpisodes(id);
        subEpisodesList = episodes.sub;
        dubEpisodesList = episodes.dub;
      } catch {
        subEpisodesList = [];
        dubEpisodesList = [];
      }

      const relatedAnime = (raw.relations?.edges || [])
        .map((edge) => (edge?.node ? normalizeAnime(edge.node) : null))
        .filter(Boolean) as Anime[];

      const recommendedAnime = (raw.recommendations?.nodes || [])
        .map((n) =>
          n?.mediaRecommendation
            ? normalizeAnime(n.mediaRecommendation)
            : null,
        )
        .filter(Boolean) as Anime[];

      return {
        ...base,
        subEpisodesList,
        dubEpisodesList,
        relatedAnime,
        recommendedAnime,
        externalStreams: normalizeExternalStreams(raw),
      };
    });
  },

  async getStreamingSources(episodeId: string): Promise<StreamingData> {
    const { data } = await client.get<MiruroWatchResponse>(
      toWatchPath(episodeId),
    );

    const streams = data.streams || [];
    const sources = streams.map((s) => ({
      url: s.url,
      isM3U8: s.isM3U8 ?? s.type === "hls",
      quality: s.quality || s.server || "unknown",
    }));

    const defaultStream =
      streams.find((s) => s.default || s.isActive) || streams[0];
    const headers: Record<string, string> = {};
    if (defaultStream?.referer) {
      headers.Referer = defaultStream.referer;
    }

    if (sources.length === 0 && data.sources) {
      return {
        sources: data.sources.map((s) => ({
          url: s.url,
          isM3U8: s.isM3U8,
          quality: s.quality,
        })),
        download: data.download || "",
        headers,
      };
    }

    return {
      sources,
      download: data.download || "",
      headers,
    };
  },

  async getGenres(): Promise<Genre[]> {
    return fetchWithCache("genres", async () => {
      try {
        const { data } = await client.get<MiruroGenresResponse>("/genres");
        const items: string[] = toItemArray(data) as unknown as string[];
        if (items.length > 0) {
          return items.map((g) => ({ id: g, name: g }));
        }
      } catch {
        // /genres is not present on all Miruro-API deployments; fall through
        // to the canonical genre list so the genre UI still works.
      }
      return FALLBACK_GENRES.map((g) => ({ id: g, name: g }));
    });
  },

  async getGenreAnime(
    genreId: string,
    page: number = 1,
  ): Promise<PaginatedAnime> {
    return fetchWithCache(`genre:${genreId}:${page}`, async () => {
      try {
        const { data } = await client.get("/filter", {
          params: { genre: genreId, page },
        });
        return normalizeListPage(toPageObject(data));
      } catch {
        const { data } = await client.get(
          `/genre/${encodeURIComponent(genreId)}`,
          { params: { page } },
        );
        return normalizeListPage(toPageObject(data));
      }
    });
  },

  async getSpotlight(): Promise<Anime | null> {
    return fetchWithCache("spotlight", async () => {
      const { data } =
        await client.get<MiruroSpotlightResponse>("/spotlight");
      const items = toItemArray(data) as unknown as MiruroAnimeItem[];
      return items.length > 0 ? normalizeAnime(items[0]) : null;
    });
  },
};
