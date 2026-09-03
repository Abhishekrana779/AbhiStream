import { useNavigate } from "react-router-dom";
import { FiPlay } from "react-icons/fi";
import ImageWithFallback from "./ImageWithFallback";
import WatchlistButton from "./WatchlistButton";
import type { Anime } from "../types/anime";

interface Props {
  anime: Anime | null;
  loading: boolean;
}

export default function Hero({ anime, loading }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="relative w-full h-[60vh] min-h-[420px]">
        <div className="skeleton absolute inset-0" />
      </div>
    );
  }

  if (!anime) return null;

  return (
    <div className="relative w-full h-[60vh] min-h-[420px] sm:h-[65vh] sm:min-h-[480px] md:h-[70vh] overflow-hidden group">
      <ImageWithFallback
        src={anime.cover || anime.poster}
        alt={anime.title}
        type="cover"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-linear-to-t from-dark-900 via-dark-900/60 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-r from-dark-900/80 via-transparent to-transparent" />

      {/* Gradient overlay enhancement */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />

      <div className="relative h-full flex items-end pb-8 sm:pb-12 md:pb-16 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-24">
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-wrap gap-2">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-400/50 text-purple-300 bg-purple-500/10 backdrop-blur hover:bg-purple-500/20 hover:border-purple-400/80 transition"
              >
                {genre}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {anime.title}
          </h1>

          {anime.jname && (
            <p className="text-gray-400 text-sm sm:text-base italic">
              {anime.jname}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-300 flex-wrap">
            {anime.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  {anime.rating}
                </span>
            )}
            {anime.type && <span>{anime.type}</span>}
            {anime.year && <span>{anime.year}</span>}
            {anime.status && (
              <span className="text-primary">{anime.status}</span>
            )}
          </div>

          {anime.description && (
            <p className="text-gray-300 text-sm sm:text-base line-clamp-3 max-w-xl">
              {anime.description}
            </p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 pt-4 flex-wrap">
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 blur-lg opacity-70 group-hover:opacity-100 transition duration-300" />
              <button
                onClick={() => navigate(`/anime/${anime.id}`)}
                className="relative flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-base hover:shadow-xl hover:shadow-purple-500/50 transition-all group-hover:scale-105 duration-300"
              >
                <FiPlay className="w-5 h-5" />
                Watch Now
              </button>
            </div>
            <WatchlistButton
              animeId={anime.id}
              title={anime.title}
              poster={anime.poster}
              status={anime.status}
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
