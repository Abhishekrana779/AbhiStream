import { apiGet } from "./api";
import type {
  PaginatedAnime,
  AnimeDetails,
  StreamingData,
  Genre,
} from "../types/anime";

export const animeApi = {
  getTrending: (page: number = 1) =>
    apiGet<PaginatedAnime>("/anime/trending", { page }),

  getPopular: (page: number = 1) =>
    apiGet<PaginatedAnime>("/anime/popular", { page }),

  getLatest: (page: number = 1) =>
    apiGet<PaginatedAnime>("/anime/latest", { page }),

  getUpcoming: (page: number = 1) =>
    apiGet<PaginatedAnime>("/anime/upcoming", { page }),

  getSpotlight: () =>
    apiGet<import("../types/anime").Anime | null>("/anime/spotlight"),

  search: (q: string, page: number = 1) =>
    apiGet<PaginatedAnime>("/anime/search", { q, page }),

  getInfo: (id: string) =>
    apiGet<AnimeDetails>(`/anime/${id}`),

  getStreamingSources: (episodeId: string) =>
    apiGet<StreamingData>(`/anime/${episodeId}/streaming`),

  getEpisodeLinks: (animeId: string, episodeNumber: number, category: "sub" | "dub" = "sub") =>
    apiGet<StreamingData>(`/anime/${animeId}/episodes`, {
      episode: episodeNumber,
      category,
    }),

  getGenres: () =>
    apiGet<Genre[]>("/anime/genres"),

  getGenreAnime: (genreId: string, page: number = 1) =>
    apiGet<PaginatedAnime>(`/anime/genre/${genreId}`, { page }),
};