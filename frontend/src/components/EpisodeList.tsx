import { Link } from "react-router-dom";
import ImageWithFallback from "./ImageWithFallback";
import type { Episode } from "../types/anime";

interface Props {
  episodes: Episode[];
  animeId: string;
  currentEpisodeId?: string;
}

export default function EpisodeList({
  episodes,
  animeId,
  currentEpisodeId,
}: Props) {
  if (episodes.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No episodes available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {episodes.map((ep) => {
        const isCurrent = ep.id === currentEpisodeId;
        return (
          <Link
            key={ep.id}
            to={`/watch/${animeId}/${ep.id}`}
            className={`flex items-center gap-4 p-3 rounded-lg transition duration-200 ${
              isCurrent
                ? "bg-primary/20 border border-primary/40"
                : "bg-dark-600 hover:bg-dark-500 border border-transparent"
            }`}
          >
            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-dark-700">
              {ep.image ? (
                <ImageWithFallback
                  src={ep.image}
                  alt={`Episode ${ep.number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                  {ep.number}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  Episode {ep.number}
                </span>
                {ep.isSub && (
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    SUB
                  </span>
                )}
                {ep.isDub && (
                  <span className="text-[10px] font-bold bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">
                    DUB
                  </span>
                )}
              </div>
              {ep.title && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">
                  {ep.title}
                </p>
              )}
            </div>
            {isCurrent && (
              <div className="shrink-0">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
