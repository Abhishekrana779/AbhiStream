import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlay, FiTrash2, FiClock, FiCheck, FiX } from "react-icons/fi";
import { historyApi } from "../services/historyApi";
import ImageWithFallback from "../components/ImageWithFallback";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { HistoryItem } from "../types/history";

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await historyApi.getAll();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    window.scrollTo(0, 0);
  }, []);

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await historyApi.remove(id);
      setHistory((items) => items.filter((item) => item._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all watch history?")) {
      return;
    }
    setLoading(true);
    try {
      await historyApi.clear();
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear history");
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (progress: number, duration: number) => {
    if (
      !Number.isFinite(progress) ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round((progress / duration) * 100)));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        <ErrorMessage message={error} onRetry={fetchHistory} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Watch History
          </h1>
          <p className="text-gray-400">
            {history.length === 0
              ? "No watch history yet"
              : `${history.length} item${history.length !== 1 ? "s" : ""} in your history`}
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-medium transition"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => {
            const progressPercent = getProgressPercentage(
              item.progress,
              item.duration,
            );
            return (
              <div
                key={item._id}
                className="group relative overflow-hidden rounded-lg bg-dark-700 border border-dark-600 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex gap-4 p-4">
                  {/* Poster */}
                  <div className="shrink-0 w-24 h-32">
                    <ImageWithFallback
                      src={item.poster}
                      alt={item.animeTitle}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-white font-semibold line-clamp-2 group-hover:text-primary transition">
                        {item.animeTitle}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Episode {item.episodeNumber}
                        {item.episodeTitle && `: ${item.episodeTitle}`}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {Math.round(item.progress / 60)}m /{" "}
                          {Math.round(item.duration / 60)}m
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-primary/60 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{formatDate(item.watchedAt)}</span>
                      </div>
                      {item.completed && (
                        <div className="flex items-center gap-1 text-green-400">
                          <FiCheck className="w-3 h-3" />
                          <span>Completed</span>
                        </div>
                      )}
                      {!item.completed && progressPercent < 100 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <FiX className="w-3 h-3" />
                          <span>Watching</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-2">
                    <button
                      onClick={() =>
                        navigate(`/watch/${item.animeId}/${item.episodeId}`)
                      }
                      className="p-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition"
                      title="Continue watching"
                    >
                      <FiPlay className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(item._id)}
                      disabled={deletingId === item._id}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition disabled:opacity-50"
                      title="Remove from history"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-gray-400 text-lg mb-6">
            Your watch history is empty
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Start Watching
          </button>
        </div>
      )}
    </div>
  );
}
