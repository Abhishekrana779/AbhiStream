import { Link } from "react-router-dom";
import ImageWithFallback from "./ImageWithFallback";
import type { Anime } from "../types/anime";

interface Props {
  anime: Anime;
}

export default function AnimeCard({ anime }: Props) {
  return (
    <Link to={`/anime/${anime.id}`} className="block group">
      <div className="relative aspect-3/4 overflow-hidden rounded-xl border border-purple-500/10 transition-all duration-300 group-hover:border-purple-500/40">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-b from-purple-600/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-lg transition duration-300 pointer-events-none" />

        <ImageWithFallback
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />

        {/* Tag badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {anime.subEpisodes && anime.subEpisodes > 0 && (
            <span className="bg-purple-600/80 backdrop-blur text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-purple-400/30">
              SUB
            </span>
          )}
          {anime.dubEpisodes && anime.dubEpisodes > 0 && (
            <span className="bg-pink-600/80 backdrop-blur text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-pink-400/30">
              DUB
            </span>
          )}
          {anime.quality && (
            <span className="bg-amber-600/80 backdrop-blur text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-amber-400/30">
              {anime.quality}
            </span>
          )}
        </div>

        {/* Rating badge */}
        {anime.rating && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-amber-400 text-[10px] sm:text-xs font-bold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 border border-amber-500/20">
            <span>★</span> {anime.rating}
          </div>
        )}

        {/* Watch button */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300">
          <div className="relative group/btn">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 blur-lg opacity-60 group-hover/btn:opacity-100 transition" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center text-xs sm:text-sm font-bold py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition">
              Watch Now
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-white text-sm font-medium line-clamp-2 leading-tight">
          {anime.title}
        </h3>
        {anime.jname && (
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
            {anime.jname}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-xs">{anime.type || "TV"}</span>
          <span className="text-gray-400 text-xs">
            {anime.subEpisodes || anime.dubEpisodes
              ? `${anime.subEpisodes || 0}/${anime.dubEpisodes || 0} Ep`
              : anime.status || ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
