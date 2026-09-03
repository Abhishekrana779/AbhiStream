import { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";

interface Props {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  large?: boolean;
}

export default function SearchBar({
  initialQuery = "",
  onSearch,
  large = false,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const firstRender = useRef(true);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const stableOnSearch = useRef(onSearch);
  stableOnSearch.current = onSearch;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stableOnSearch.current?.(debouncedQuery);
  }, [debouncedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative group">
        {focused && (
          <div className="absolute -inset-0.5 rounded-full bg-linear-to-r from-purple-600/50 to-pink-500/50 blur opacity-75 transition" />
        )}
        <div
          className={`relative flex items-center bg-dark-600 border rounded-full transition duration-300 ${
            focused ? "border-purple-500/60" : "border-purple-500/20"
          } ${large ? "h-10 sm:h-12 md:h-14" : "h-8 sm:h-9 md:h-10"}`}
        >
          <FiSearch
            className={`text-purple-400 ml-2 sm:ml-3 md:ml-4 shrink-0 ${
              large ? "w-4 h-4 sm:w-5 sm:h-5" : "w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search anime..."
            className={`flex-1 bg-transparent text-white placeholder-gray-400 outline-none px-1.5 sm:px-2 md:px-3 ${
              large ? "text-sm sm:text-base" : "text-xs sm:text-sm"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="mr-1.5 sm:mr-2 md:mr-3 text-gray-400 hover:text-purple-400 transition"
            >
              <FiX className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
