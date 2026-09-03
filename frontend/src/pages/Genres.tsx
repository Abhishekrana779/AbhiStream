import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiGrid } from "react-icons/fi";
import { animeApi } from "../services/animeApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { Genre } from "../types/anime";

export default function Genres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenres = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await animeApi.getGenres();
      setGenres(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load genres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
    window.scrollTo(0, 0);
  }, []);

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
        <ErrorMessage message={error} onRetry={fetchGenres} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Browse by Genre</h1>
        <p className="text-gray-400 text-lg">
          Explore anime across {genres.length} different genres
        </p>
      </div>

      {genres.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={`/genres/${encodeURIComponent(genre.id)}`}
              className="group relative overflow-hidden rounded-xl bg-linear-to-br from-dark-700 to-dark-800 border border-dark-600 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white group-hover:text-primary transition">
                    {genre.name}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Explore anime</p>
                </div>
                <div className="shrink-0 ml-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                    <FiArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 text-gray-500 flex justify-center"><FiGrid /></div>
          <p className="text-gray-400 text-lg">No genres available</p>
        </div>
      )}
    </div>
  );
}
