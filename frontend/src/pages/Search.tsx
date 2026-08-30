import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { animeApi } from "../services/animeApi";
import { useDebounce } from "../hooks/useDebounce";
import SearchBar from "../components/SearchBar";
import AnimeGrid from "../components/AnimeGrid";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { Anime } from "../types/anime";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Anime[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q: string, p: number) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await animeApi.search(q, p);
      setResults(data.anime);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setPage(1);
    doSearch(q, 1);
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery !== searchParams.get("q")) {
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, setSearchParams, searchParams]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    doSearch(query, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Search Anime
        </h1>
        <SearchBar
          key={initialQuery}
          initialQuery={initialQuery}
          onSearch={(q) => {
            setQuery(q);
            if (!q.trim()) {
              setResults([]);
              setSearched(false);
              setSearchParams({});
            }
          }}
          large
        />
      </div>

      {loading && <Loading />}

      {error && <ErrorMessage message={error} onRetry={() => doSearch(query, page)} />}

      {!loading && !error && searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-400 text-lg">No anime found for "{query}"</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="text-gray-400 text-sm mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <AnimeGrid anime={results} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!loading && !error && !searched && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-gray-400 text-lg">
            Search for your favorite anime
          </p>
        </div>
      )}
    </div>
  );
}
