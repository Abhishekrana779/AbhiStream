import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiPlay, FiCalendar, FiFilter, FiBookmark } from "react-icons/fi";
import { watchlistApi } from "../services/watchlistApi";
import ImageWithFallback from "../components/ImageWithFallback";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { WatchlistItem } from "../types/watchlist";

export default function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState<WatchlistItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await watchlistApi.getAll();
      setWatchlist(data);
      setFilteredWatchlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    window.scrollTo(0, 0);
  }, []);

  // Filter watchlist by status
  useEffect(() => {
    if (statusFilter) {
      setFilteredWatchlist(
        watchlist.filter((item) => item.status === statusFilter),
      );
    } else {
      setFilteredWatchlist(watchlist);
    }
  }, [statusFilter, watchlist]);

  const handleRemove = async (id: string, animeId: string) => {
    setDeletingId(id);
    try {
      await watchlistApi.remove(animeId);
      setWatchlist((items) => items.filter((item) => item._id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove from watchlist",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusStyles = (status: string | null) => {
    switch (status) {
      case "Airing":
        return "bg-green-500/20 text-green-400";
      case "Finished Airing":
        return "bg-blue-500/20 text-blue-400";
      case "Not yet aired":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getUniqueStatuses = () => {
    const statuses = new Set(
      watchlist.filter((item) => item.status).map((item) => item.status),
    );
    return Array.from(statuses).filter(Boolean) as string[];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ErrorMessage message={error} onRetry={fetchWatchlist} />
      </div>
    );
  }

  const uniqueStatuses = getUniqueStatuses();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          My Watchlist
        </h1>
        <p className="text-gray-400">
          {watchlist.length === 0
            ? "Your watchlist is empty"
            : `${watchlist.length} anime${watchlist.length !== 1 ? "s" : ""} in your watchlist`}
        </p>
      </div>

      {/* Filter Section */}
      {watchlist.length > 0 && uniqueStatuses.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === null
                  ? "bg-primary text-white"
                  : "bg-dark-700 text-gray-300 hover:bg-dark-600"
              }`}
            >
              All ({watchlist.length})
            </button>
            {uniqueStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? "bg-primary text-white"
                    : "bg-dark-700 text-gray-300 hover:bg-dark-600"
                }`}
              >
                {status} (
                {watchlist.filter((item) => item.status === status).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist Grid */}
      {filteredWatchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWatchlist.map((item) => (
            <div
              key={item._id}
              className="group relative bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Poster */}
              <div className="relative overflow-hidden bg-dark-700 aspect-3/4">
                <ImageWithFallback
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badge */}
                {item.status && (
                  <div
                    className={`absolute top-2 right-2 text-xs font-bold px-3 py-1 rounded-full ${getStatusStyles(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </div>
                )}

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate(`/anime/${item.animeId}`)}
                    className="p-3 rounded-full bg-primary text-white hover:bg-primary/80 transition"
                    title="View details"
                  >
                    <FiPlay className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRemove(item._id, item.animeId)}
                    disabled={deletingId === item._id}
                    className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition disabled:opacity-50"
                    title="Remove from watchlist"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-primary transition">
                  {item.title}
                </h3>

                {/* Added Date */}
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                   Added {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 text-gray-500 flex justify-center"><FiBookmark /></div>
          <p className="text-gray-400 text-lg mb-6">Your watchlist is empty</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Start Exploring
          </button>
        </div>
      )}

      {/* No Results for Filter */}
      {watchlist.length > 0 && filteredWatchlist.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 text-gray-500 flex justify-center"><FiFilter /></div>
          <p className="text-gray-400 text-lg mb-6">
            No anime found with status "{statusFilter}"
          </p>
          <button onClick={() => setStatusFilter(null)} className="btn-primary">
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}
