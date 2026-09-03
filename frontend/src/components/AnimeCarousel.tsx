import { useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Anime } from "../types/anime";
import AnimeCard from "./AnimeCard";

interface Props {
  title: string;
  anime: Anime[];
  linkTo?: string;
}

export default function AnimeCarousel({ title, anime, linkTo }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (anime.length === 0) return null;

  return (
    <section className="mb-12 group">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/10">
        <div>
          <h2 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition">
            {title}
          </h2>
        </div>
        {linkTo && (
          <a
            href={linkTo}
            className="text-purple-400 text-sm font-semibold hover:text-pink-400 transition flex items-center gap-2 group/link"
          >
            View All
            <span className="group-hover/link:translate-x-1 transition">→</span>
          </a>
        )}
      </div>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-[#08080d]/80 via-[#08080d]/40 to-transparent z-10 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition duration-300 group-hover:from-purple-900/20"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 flex items-center justify-center hover:scale-110 transition-all">
              <FiChevronLeft className="w-5 h-5 text-purple-300" />
            </div>
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory scroll-pl-3 sm:scroll-pl-0"
        >
          {anime.map((item) => (
            <div key={item.id} className="shrink-0 w-40 sm:w-44 md:w-52">
              <AnimeCard anime={item} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-[#08080d]/80 via-[#08080d]/40 to-transparent z-10 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition duration-300 group-hover:from-purple-900/20"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 flex items-center justify-center hover:scale-110 transition-all">
              <FiChevronRight className="w-5 h-5 text-purple-300" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
