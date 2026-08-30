import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import type { StreamingData } from "../types/anime";

interface Props {
  streamingData: StreamingData | null;
  poster?: string;
  autoPlay?: boolean;
  onProgress?: (progress: number, duration: number) => void;
}

export default function VideoPlayer({ streamingData, poster, autoPlay = true, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!streamingData || !videoRef.current) return;

    cleanup();
    setError(null);
    setLoading(true);

    const video = videoRef.current;
    const hlsSource = streamingData.sources.find((s) => s.isM3U8);
    const directSource = streamingData.sources.find((s) => !s.isM3U8);
    const source = hlsSource || directSource;

    if (!source) {
      setError("No playable source available");
      setLoading(false);
      return;
    }

    if (source.isM3U8) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr) => {
            if (streamingData.headers) {
              Object.entries(streamingData.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
              });
            }
          },
        });

        hls.loadSource(source.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Network error. Trying to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Media error. Trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                setError("Fatal playback error");
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        }, { once: true });
      } else {
        setError("HLS is not supported in this browser");
        setLoading(false);
      }
    } else {
      video.src = source.url;
      video.addEventListener("loadeddata", () => {
        setLoading(false);
        if (autoPlay) video.play().catch(() => {});
      }, { once: true });
      video.addEventListener("error", () => {
        setError("Failed to load video");
        setLoading(false);
      }, { once: true });
    }

    return cleanup;
  }, [streamingData, autoPlay, cleanup]);

  useEffect(() => {
    if (!onProgress || !videoRef.current) return;

    progressTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && video.duration > 0) {
        onProgress(video.currentTime, video.duration);
      }
    }, 5000);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [onProgress]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || document.activeElement?.tagName === "INPUT") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) {
            void video.play();
          } else {
            video.pause();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime -= 10;
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime += 10;
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "f":
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen();
          }
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-video pl-3 pr-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-4">
          <p className="text-red-400 text-base sm:text-lg mb-2">⚠️</p>
          <p className="text-gray-300 text-xs sm:text-sm text-center">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload"
        playsInline
        poster={poster}
      />
    </div>
  );
}
