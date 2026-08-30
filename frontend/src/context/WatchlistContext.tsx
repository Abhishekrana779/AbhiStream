import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { watchlistApi } from "../services/watchlistApi";
import { useAuth } from "../hooks/useAuth";
import type { WatchlistItem } from "../types/watchlist";

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  loading: boolean;
  addToWatchlist: (
    animeId: string,
    title: string,
    poster: string,
    status: string | null,
  ) => Promise<void>;
  removeFromWatchlist: (animeId: string) => Promise<void>;
  isInWatchlist: (animeId: string) => boolean;
  refreshWatchlist: () => Promise<void>;
}

export const WatchlistContext = createContext<WatchlistContextType | null>(
  null,
);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    try {
      setLoading(true);
      const data = await watchlistApi.getAll();
      setWatchlist(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToWatchlist = async (
    animeId: string,
    title: string,
    poster: string,
    status: string | null,
  ) => {
    const item = await watchlistApi.add({ animeId, title, poster, status });
    setWatchlist((prev) => [item, ...prev]);
  };

  const removeFromWatchlist = async (animeId: string) => {
    await watchlistApi.remove(animeId);
    setWatchlist((prev) => prev.filter((w) => w.animeId !== animeId));
  };

  const isInWatchlist = useCallback(
    (animeId: string) => watchlist.some((w) => w.animeId === animeId),
    [watchlist],
  );

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}
