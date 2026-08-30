import { useEffect, useState } from "react";
import { FALLBACK_POSTER, FALLBACK_COVER } from "../utils/constants";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  type?: "poster" | "cover";
}

export default function ImageWithFallback({ src, alt, className = "", type = "poster" }: Props) {
  const [error, setError] = useState(false);
  const fallback = type === "cover" ? FALLBACK_COVER : FALLBACK_POSTER;
  const imgSrc = (!src || error) ? fallback : src;

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
