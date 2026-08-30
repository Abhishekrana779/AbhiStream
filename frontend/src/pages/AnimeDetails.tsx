import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlay,
  FiClock,
  FiStar,
  FiCalendar,
  FiFilm,
  FiTrendingUp,
  FiAward,
} from "react-icons/fi";
import { animeApi } from "../services/animeApi";
import ImageWithFallback from "../components/ImageWithFallback";
import WatchlistButton from "../components/WatchlistButton";
import EpisodeList from "../components/EpisodeList";
import AnimeCarousel from "../components/AnimeCarousel";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { AnimeDetails as AnimeDetailsType, Episode } from "../types/anime";

export default function AnimeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<AnimeDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSub, setShowSub] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await animeApi.getInfo(id);
      setAnime(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load anime");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <Loading type="detail" />
      </div>
    );
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  if (!anime)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ErrorMessage message="Anime not found" />
      </div>
    );

  const allEpisodes: Episode[] = showSub
    ? anime.subEpisodesList
    : anime.dubEpisodesList;
  const firstEpisode = anime.subEpisodesList[0] || anime.dubEpisodesList[0];

  const InfoRow = ({
    icon,
    label,
  }: {
    icon: React.ReactNode;
    label?: string;
  }) =>
    label && (
      <div className="flex items-center gap-2 text-sm text-gray-300">
        {icon}
        <span>{label}</span>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="relative h-[40vh] sm:h-[50vh]">
        <ImageWithFallback
          src={anime.cover || anime.poster}
          alt={anime.title}
          type="cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-dark-900 via-dark-900/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0 w-44 sm:w-52 mx-auto md:mx-0">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-600/50 to-pink-500/50 blur-md opacity-60 group-hover:opacity-100 transition duration-300" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 group-hover:border-purple-500/60 transition">
                <ImageWithFallback
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full aspect-3/4 object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                {anime.title}
              </h1>
              {anime.jname && (
                <p className="text-gray-400 italic mt-1">{anime.jname}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  to={`/search?q=${encodeURIComponent(g)}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-400/50 hover:bg-purple-500/20 hover:border-purple-400/80 transition"
                >
                  {g}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoRow
                icon={<FiStar className="w-4 h-4 text-yellow-400" />}
                label={anime.rating ? `Rating: ${anime.rating}` : undefined}
              />
              <InfoRow
                icon={<FiFilm className="w-4 h-4 text-primary" />}
                label={anime.type || undefined}
              />
              <InfoRow
                icon={<FiClock className="w-4 h-4 text-blue-400" />}
                label={anime.duration || undefined}
              />
              <InfoRow
                icon={<FiCalendar className="w-4 h-4 text-green-400" />}
                label={anime.aired || anime.premiered || undefined}
              />
              <InfoRow
                icon={<FiTrendingUp className="w-4 h-4 text-orange-400" />}
                label={
                  anime.popularity
                    ? `Popularity: #${anime.popularity}`
                    : undefined
                }
              />
              <InfoRow
                icon={<FiAward className="w-4 h-4 text-purple-400" />}
                label={anime.rank ? `Rank: #${anime.rank}` : undefined}
              />
            </div>

            {anime.status && (
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                  anime.status === "Airing"
                    ? "bg-green-500/20 text-green-400"
                    : anime.status === "Finished Airing"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {anime.status}
              </span>
            )}

            {anime.description && (
              <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
                {anime.description}
              </p>
            )}

            {(anime.studios.length > 0 || anime.producers.length > 0) && (
              <div className="text-sm space-y-1">
                {anime.studios.length > 0 && (
                  <p className="text-gray-400">
                    Studio:{" "}
                    <span className="text-gray-200">
                      {anime.studios.join(", ")}
                    </span>
                  </p>
                )}
                {anime.producers.length > 0 && (
                  <p className="text-gray-400">
                    Producer:{" "}
                    <span className="text-gray-200">
                      {anime.producers.join(", ")}
                    </span>
                  </p>
                )}
                {anime.season && (
                  <p className="text-gray-400">
                    Season:{" "}
                    <span className="text-gray-200">
                      {anime.season} {anime.year || ""}
                    </span>
                  </p>
                )}
                {anime.score && (
                  <p className="text-gray-400">
                    Score:{" "}
                    <span className="text-yellow-400">{anime.score}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {firstEpisode ? (
                <button
                  onClick={() =>
                    navigate(`/watch/${anime.id}/${firstEpisode.id}`)
                  }
                  className="btn-primary"
                >
                  <FiPlay className="w-5 h-5" />
                  Watch Now
                </button>
              ) : anime.externalStreams &&
                anime.externalStreams.length > 0 ? (
                <a
                  href={anime.externalStreams[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <FiPlay className="w-5 h-5" />
                  Watch Now
                </a>
              ) : null}
              <WatchlistButton
                animeId={anime.id}
                title={anime.title}
                poster={anime.poster}
                status={anime.status || "Unknown"}
              />
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Episodes</h2>
            {anime.subEpisodesList.length > 0 &&
              anime.dubEpisodesList.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSub(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      showSub
                        ? "bg-primary text-white"
                        : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                    }`}
                  >
                    Sub
                  </button>
                  <button
                    onClick={() => setShowSub(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      !showSub
                        ? "bg-primary text-white"
                        : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                    }`}
                  >
                    Dub
                  </button>
                </div>
              )}
          </div>
          {allEpisodes.length > 0 ? (
            <EpisodeList episodes={allEpisodes} animeId={anime.id} />
          ) : (
            <p className="text-gray-400 text-center py-8">
              No episodes available
            </p>
          )}
        </div>

        {/* Related Anime Section */}
        {anime.relatedAnime.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">
              Related Anime
            </h2>
            <AnimeCarousel title="Related Anime" anime={anime.relatedAnime} />
          </div>
        )}

        {/* Recommended Anime Section */}
        {anime.recommendedAnime.length > 0 && (
          <div className="mt-16 pb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Recommended For You
            </h2>
            <AnimeCarousel title="Recommended" anime={anime.recommendedAnime} />
          </div>
        )}
      </div>
    </div>
  );
}
