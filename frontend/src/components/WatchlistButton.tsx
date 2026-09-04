import { useState, useRef, useEffect } from "react";
import { FiBookmark, FiCheck } from "react-icons/fi";
import { useWatchlist } from "../context/WatchlistContext";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props {
  animeId: string;
  title: string;
  poster: string;
  status: string | null;
  size?: "sm" | "md" | "lg";
}

export default function WatchlistButton({
  animeId,
  title,
  poster,
  status,
  size = "md",
}: Props) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inListRef = useRef(isInWatchlist(animeId));

  useEffect(() => {
    inListRef.current = isInWatchlist(animeId);
  }, [isInWatchlist, animeId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      if (inListRef.current) {
        await removeFromWatchlist(animeId);
      } else {
        await addToWatchlist(animeId, title, poster, status);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-1.5",
    lg: "px-6 py-3 text-base gap-2",
  };

  const iconSize = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="relative group">
      {!inListRef.current && (
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600/50 to-pink-500/50 blur opacity-0 group-hover:opacity-75 transition duration-300" />
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`relative rounded-lg font-semibold transition duration-300 flex items-center ${sizeClasses[size]} ${
          inListRef.current
            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50"
            : "bg-dark-600 text-white border border-purple-500/30 hover:border-purple-500/60 hover:bg-dark-500"
        } disabled:opacity-50`}
      >
        {inListRef.current ? (
          <FiCheck className={iconSize[size]} />
        ) : (
          <FiBookmark className={iconSize[size]} />
        )}
        {inListRef.current ? "In Watchlist" : "Watchlist"}
      </button>
    </div>
  );
}
