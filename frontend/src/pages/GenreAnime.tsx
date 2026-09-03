import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiFilm } from "react-icons/fi";
import { animeApi } from "../services/animeApi";
import AnimeGrid from "../components/AnimeGrid";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { Anime } from "../types/anime";

export default function GenreAnime() {
  const { genre } = useParams<{ genre: string }>();
  const decodedGenre = genre ? decodeURIComponent(genre) : "";
  const [page, setPage] = useState(1);
  const [anime, setAnime] = useState<Anime[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenreAnime = async (genreId: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await animeApi.getGenreAnime(genreId, pageNum);
      setAnime(data.anime);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load anime for this genre",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!decodedGenre) return;
    setPage(1);
    fetchGenreAnime(decodedGenre, 1);
    window.scrollTo(0, 0);
  }, [decodedGenre]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (decodedGenre) {
      fetchGenreAnime(decodedGenre, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!decodedGenre) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ErrorMessage message="Genre not found" />
      </div>
    );
  }

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
        <ErrorMessage
          message={error}
          onRetry={() => fetchGenreAnime(decodedGenre, page)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {decodedGenre}
        </h1>
        <p className="text-gray-400">
          {anime.length > 0
            ? `Showing ${anime.length} anime from the ${decodedGenre} genre`
            : `No anime found in the ${decodedGenre} genre`}
        </p>
      </div>

      {anime.length > 0 ? (
        <>
          <AnimeGrid anime={anime} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 text-gray-500 flex justify-center"><FiFilm /></div>
          <p className="text-gray-400 text-lg">
            No anime found in the {decodedGenre} genre
          </p>
        </div>
      )}
    </div>
  );
}
