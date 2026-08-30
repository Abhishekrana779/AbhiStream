import type { Anime } from "../types/anime";
import AnimeCard from "./AnimeCard";

interface Props {
  anime: Anime[];
}

export default function AnimeGrid({ anime }: Props) {
  if (anime.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-400 text-lg">No anime found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {anime.map((item) => (
        <AnimeCard key={item.id} anime={item} />
      ))}
    </div>
  );
}