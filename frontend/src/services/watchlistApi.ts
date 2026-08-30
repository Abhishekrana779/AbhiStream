import { apiGet, apiPost, apiDelete } from "./api";
import type { WatchlistItem } from "../types/watchlist";

export const watchlistApi = {
  getAll: () =>
    apiGet<WatchlistItem[]>("/watchlist"),

  add: (data: { animeId: string; title: string; poster: string; status: string | null }) =>
    apiPost<WatchlistItem>("/watchlist", data),

  remove: (animeId: string) =>
    apiDelete(`/watchlist/${animeId}`),

  check: (animeId: string) =>
    apiGet<{ isInWatchlist: boolean }>(`/watchlist/check/${animeId}`),
};
