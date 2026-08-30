import { useState, useEffect } from "react";
import { animeApi } from "../services/animeApi";
import Hero from "../components/Hero";
import AnimeCarousel from "../components/AnimeCarousel";
import ErrorMessage from "../components/ErrorMessage";
import type { Anime } from "../types/anime";

export default function Home() {
  const [spotlight, setSpotlight] = useState<Anime | null>(null);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [latest, setLatest] = useState<Anime[]>([]);
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        spotlightData,
        trendingData,
        popularData,
        latestData,
        upcomingData,
      ] = await Promise.all([
        animeApi.getSpotlight().catch(() => null),
        animeApi.getTrending().catch(() => null),
        animeApi.getPopular().catch(() => null),
        animeApi.getLatest().catch(() => null),
        animeApi.getUpcoming().catch(() => null),
      ]);

      if (!trendingData && !popularData && !latestData && !upcomingData) {
        throw new Error("Unable to load anime data. Please try again.");
      }

      setSpotlight(spotlightData);
      setTrending(trendingData?.anime || []);
      setPopular(popularData?.anime || []);
      setLatest(latestData?.anime || []);
      setUpcoming(upcomingData?.anime || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homepage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <Hero anime={null} loading={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="skeleton h-7 w-40 rounded mb-4" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="shrink-0 w-45">
                    <div className="skeleton aspect-3/4 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && trending.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div>
      <Hero anime={spotlight} loading={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trending.length > 0 && (
          <AnimeCarousel title="🔥 Trending Now" anime={trending} />
        )}
        {popular.length > 0 && (
          <AnimeCarousel title="⭐ Popular Anime" anime={popular} />
        )}
        {latest.length > 0 && (
          <AnimeCarousel title="📺 Latest Episodes" anime={latest} />
        )}
        {upcoming.length > 0 && (
          <AnimeCarousel title="📅 Upcoming Anime" anime={upcoming} />
        )}
      </div>
    </div>
  );
}
