import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPlay,
  FiPause,
  FiMaximize,
  FiMinimize,
  FiList,
  FiSearch,
  FiClock,
  FiSettings,
  FiSkipBack,
  FiSkipForward,
} from "react-icons/fi";
import { animeApi } from "../services/animeApi";
import { historyApi } from "../services/historyApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import type { AnimeDetails, Episode, StreamingServer, StreamingSource } from "../types/anime";

type TrackType = "sub" | "dub";

export default function Watch() {
  const { animeId, episodeId } = useParams<{
    animeId: string;
    episodeId: string;
  }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamingSources, setStreamingSources] = useState<StreamingSource[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] =
    useState<StreamingSource | null>(null);
  const [streamingHeaders, setStreamingHeaders] = useState<
    Record<string, string>
  >({});
  const [introSkip, setIntroSkip] = useState<{ start: number; end: number } | null>(null);
  const [outroSkip, setOutroSkip] = useState<{ start: number; end: number } | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [trackType, setTrackType] = useState<TrackType>("sub");
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);
  const [lightsOff, setLightsOff] = useState(false);
  const [dubAvailable, setDubAvailable] = useState(false);
  const [servers, setServers] = useState<StreamingServer[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [favoriteServers, setFavoriteServers] = useState<Set<string>>(new Set());
  const seekingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  const wasPlayingBeforeSeekRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("abhistream_favorite_servers");
      if (saved) {
        setFavoriteServers(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchEpisodeSources = useCallback(
    async (animeIdStr: string, epNumber: number, category: TrackType) => {
      try {
        const streaming = await animeApi.getEpisodeLinks(animeIdStr, epNumber, category);
        if (streaming.sources.length > 0) return streaming;
      } catch {
        // fall through
      }
      return { sources: [] as StreamingSource[], headers: {} as Record<string, string> };
    },
    [],
  );

  const applyStreamingToPlayer = useCallback(
    (streaming: {
      sources: StreamingSource[];
      headers: Record<string, string>;
      intro?: { start: number; end: number };
      outro?: { start: number; end: number };
      servers?: StreamingServer[];
    }) => {
      setStreamingSources(streaming.sources);
      setStreamingHeaders(streaming.headers || {});
      setServers(streaming.servers || []);
      setIntroSkip(streaming.intro || null);
      setOutroSkip(streaming.outro || null);

      let nextSource: StreamingSource | null = streaming.sources[0] || null;
      if (!nextSource && anime?.externalStreams && anime.externalStreams.length > 0) {
        const ext = anime.externalStreams[0];
        nextSource = { url: ext.url, isM3U8: /\.m3u8($|\?)/i.test(ext.url), quality: ext.site || "external" };
      }
      setSelectedQuality(nextSource);
      setActiveProvider(nextSource?.provider || streaming.servers?.[0]?.provider || null);
    },
    [anime],
  );

  const selectServer = useCallback(
    (provider: string) => {
      const server = servers.find((s) => s.provider === provider);
      if (!server) return;
      setActiveProvider(provider);
      setSelectedQuality({
        url: server.url,
        isM3U8: server.isM3U8,
        quality: server.quality,
        provider: server.provider,
      });
      setStreamingHeaders(server.referer ? { Referer: server.referer } : {});
      const v = videoRef.current;
      if (v) {
        v.pause();
      }
    },
    [servers],
  );

  const toggleFavoriteServer = useCallback((provider: string) => {
    setFavoriteServers((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      localStorage.setItem("abhistream_favorite_servers", JSON.stringify([...next]));
      return next;
    });
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

  const proxySource = (url: string): string => {
    const params = new URLSearchParams({ url });
    const referer = streamingHeaders?.Referer;
    if (referer) params.set("referer", referer);
    return `${API_BASE_URL}/anime/stream?${params.toString()}`;
  };

  const getAbsoluteProxyUrl = (url: string): string => {
    const relative = proxySource(url);
    try {
      return new URL(relative, window.location.origin).href;
    } catch {
      return relative;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!animeId || !episodeId) {
        setError("Episode not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setDubAvailable(false);

      try {
        const animeData = await animeApi.getInfo(animeId);
        if (cancelled) return;
        setAnime(animeData);

        const allEpisodes = [
          ...animeData.subEpisodesList,
          ...animeData.dubEpisodesList,
        ];
        const episode = allEpisodes.find((ep) => ep.id === episodeId);
        if (episode) {
          setCurrentEpisode(episode);
          setTrackType(episode.isSub ? "sub" : episode.isDub ? "dub" : "sub");
        }

        const episodeNumber = episode?.number ?? 0;

        let streaming: {
          sources: StreamingSource[];
          headers: Record<string, string>;
          intro?: { start: number; end: number };
          outro?: { start: number; end: number };
          servers?: StreamingServer[];
        } = { sources: [], headers: {} };
        if (Number.isFinite(episodeNumber) && episodeNumber > 0) {
          const initialCategory =
            episode?.isDub && !episode?.isSub ? "dub" : "sub";
          streaming = await fetchEpisodeSources(animeId, episodeNumber, initialCategory);
          if (cancelled) return;

          if (streaming.sources.length === 0) {
            const altCategory = initialCategory === "dub" ? "sub" : "dub";
            streaming = await fetchEpisodeSources(animeId, episodeNumber, altCategory);
            if (cancelled) return;
          }

          fetchEpisodeSources(animeId, episodeNumber, "dub")
            .then((dubResult) => {
              setDubAvailable(dubResult.sources.length > 0);
            })
            .catch(() => setDubAvailable(false));
        }

        if (streaming.sources.length === 0) {
          try {
            const fallback = await animeApi.getStreamingSources(episodeId);
            streaming = { ...streaming, sources: fallback.sources, headers: fallback.headers };
          } catch {
            // ignore
          }
        }

        if (streaming.sources.length === 0) {
          setError("No streaming sources available for this episode.");
        }

        applyStreamingToPlayer(streaming);

        if (episode) {
          try {
            const historyItem = await historyApi.add({
              animeId,
              episodeId,
              animeTitle: animeData.title,
              episodeNumber: episode.number,
              episodeTitle: episode.title,
              poster: animeData.poster,
              progress: 0,
              duration: 0,
              completed: false,
            });
            if (cancelled) return;
            if (historyItem && typeof historyItem._id === "string") {
              setHistoryId(historyItem._id);
            }
          } catch {
            // Unauthenticated users get 401 — history tracking is silently skipped.
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load episode");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [animeId, episodeId]);

  useEffect(() => {
    if (!animeId || !episodeId) return;
    const episodeNumber = currentEpisode?.number ?? 0;
    if (!Number.isFinite(episodeNumber) || episodeNumber <= 0) return;

    let cancelled = false;
    (async () => {
      let streaming = await fetchEpisodeSources(animeId, episodeNumber, trackType);
      if (cancelled) return;

      if (streaming.sources.length === 0 && trackType === "dub") {
        streaming = await fetchEpisodeSources(animeId, episodeNumber, "sub");
        if (cancelled) return;
      }

      if (streaming.sources.length === 0) {
        try {
          const fallback = await animeApi.getStreamingSources(episodeId);
          streaming = { ...streaming, sources: fallback.sources, headers: fallback.headers };
        } catch {
          // ignore
        }
      }

      if (streaming.sources.length > 0) {
        setError(null);
        applyStreamingToPlayer(streaming);
      } else {
        setError("No sources available for this language");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackType, animeId, episodeId, currentEpisode, fetchEpisodeSources, applyStreamingToPlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedQuality) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.removeAttribute("src");
    video.load();

    let disposed = false;
    const absoluteSourceUrl = getAbsoluteProxyUrl(selectedQuality.url);

    if (selectedQuality.isM3U8) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          abrEwmaFastLive: 3.0,
          abrEwmaSlowLive: 9.0,
          startLevel: -1,
          capLevelToPlayerSize: true,
        });
        hls.loadSource(absoluteSourceUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!disposed && (isPlayingRef.current || autoPlay)) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            const httpStatus = data.response?.code;
            if (
              data.type === Hls.ErrorTypes.NETWORK_ERROR &&
              (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
                httpStatus === 403 ||
                httpStatus === 410)
            ) {
              hls.destroy();
              hlsRef.current = null;
              setError(
                httpStatus === 403
                  ? "Stream access denied (403). The source URL may have expired or the CDN rejected the request. Try another server."
                  : httpStatus === 410
                    ? "Stream expired (410). The source URL is no longer available. Try switching to a different server or episode."
                    : "Failed to load stream manifest. Please try another source.",
              );
              return;
            }
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                hlsRef.current = null;
                setError(data.error?.message || "Fatal playback error. Please try another source.");
                break;
            }
          }
        });

        return () => {
          disposed = true;
          hlsRef.current?.destroy();
          hlsRef.current = null;
          video.removeAttribute("src");
          video.load();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = absoluteSourceUrl;
        const onMeta = () => {
          if (!disposed && (isPlayingRef.current || autoPlay)) video.play().catch(() => {});
        };
        video.addEventListener("loadedmetadata", onMeta, { once: true });
        return () => {
          disposed = true;
          video.removeEventListener("loadedmetadata", onMeta);
          video.removeAttribute("src");
          video.load();
        };
      }
    }

    video.src = absoluteSourceUrl;
    video.load();
    const onLoaded = () => {
      if (!disposed && (isPlayingRef.current || autoPlay)) video.play().catch(() => {});
    };
    const onError = () => {
      if (!disposed) {
        setError("Failed to load video source. Please try another source.");
      }
    };
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
    return () => {
      disposed = true;
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
      video.removeAttribute("src");
      video.load();
    };
  }, [selectedQuality, streamingHeaders, autoPlay]);

  useEffect(() => {
    if (!historyId) return;

    let cancelled = false;
    let consecutiveFailures = 0;
    let inFlight = false;
    let lastSentProgress = -1;
    let backoffTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled || inFlight) return;
      const video = videoRef.current;
      if (!video || video.duration <= 0) return;
      const progress = video.currentTime;
      if (Math.round(progress) === lastSentProgress) return;
      inFlight = true;
      try {
        await historyApi.update(historyId, {
          progress,
          duration: video.duration,
          completed: progress / video.duration > 0.9,
        });
        lastSentProgress = Math.round(progress);
        consecutiveFailures = 0;
      } catch {
        consecutiveFailures++;
      } finally {
        inFlight = false;
      }
    };

    const schedule = (): void => {
      if (cancelled) return;
      if (consecutiveFailures >= 3) return;
      const delay = consecutiveFailures > 0 ? 2000 * consecutiveFailures : 10000;
      backoffTimer = setTimeout(() => {
        backoffTimer = null;
        void tick();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (backoffTimer) clearTimeout(backoffTimer);
    };
  }, [historyId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(video.duration || 0);

    let rafId: number | null = null;
    const handleTimeUpdate = () => {
      if (seekingRef.current) return;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setCurrentTime(video.currentTime || 0);
        rafId = null;
      });
    };

    const handleSeeked = () => {
      seekingRef.current = false;
      if (wasPlayingBeforeSeekRef.current) {
        video.play().catch(() => {});
        wasPlayingBeforeSeekRef.current = false;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [selectedQuality]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleSkipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    wasPlayingBeforeSeekRef.current = !video.paused;
    seekingRef.current = true;
    video.currentTime = Math.max(0, video.currentTime - 15);
  }, []);

  const handleSkipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    wasPlayingBeforeSeekRef.current = !video.paused;
    seekingRef.current = true;
    video.currentTime = Math.min(duration, video.currentTime + 15);
  }, [duration]);

  const lockLandscape = async (): Promise<void> => {
    type OrientAPI = {
      lock?: (orientation: string) => Promise<void>;
    };
    const screenWithOrient = screen as Screen & { orientation?: OrientAPI };
    const orientation = screenWithOrient.orientation as
      | (OrientAPI & { lock?: (orientation: string) => Promise<void> })
      | undefined;
    try {
      if (orientation?.lock) {
        await orientation.lock("landscape");
      }
    } catch {
      // Lock request can fail on unsupported devices / insecure contexts — ignore.
    }
  };

  const unlockOrientation = (): void => {
    type OrientAPI = {
      lock?: (orientation: string) => Promise<void>;
    };
    const screenWithOrient = screen as Screen & { orientation?: OrientAPI };
    const orientation = screenWithOrient.orientation as
      | (OrientAPI & { unlock?: () => void })
      | undefined;
    try {
      orientation?.unlock?.();
    } catch {
      // ignore
    }
  };

  const handleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          void lockLandscape();
        })
        .catch(() => {
          setIsFullscreen(false);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          unlockOrientation();
        })
        .catch(() => {
          setIsFullscreen(true);
        });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) unlockOrientation();
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const goToNextEpisode = () => {
    if (!anime || !currentEpisode) return;
    const list =
      trackType === "sub"
        ? anime.subEpisodesList
        : anime.dubEpisodesList.length > 0
          ? anime.dubEpisodesList
          : anime.subEpisodesList;
    const currentIndex = list.findIndex((ep) => ep.id === episodeId);
    if (currentIndex < list.length - 1) {
      const nextEpisode = list[currentIndex + 1];
      navigate(`/watch/${animeId}/${nextEpisode.id}`);
    }
  };

  const handleEpisodeSelect = (ep: Episode) => {
    navigate(`/watch/${animeId}/${ep.id}`);
  };

  const handleTrackTypeChange = (type: TrackType) => {
    setTrackType(type);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoSkip) return;

    const introApplied = { current: false };
    const outroApplied = { current: false };

    const handleTimeUpdate = () => {
      if (introSkip && !introApplied.current && video.currentTime >= introSkip.start && video.currentTime < introSkip.end) {
        introApplied.current = true;
        video.currentTime = introSkip.end;
      }
      if (outroSkip && !outroApplied.current && video.currentTime >= outroSkip.start) {
        outroApplied.current = true;
        goToNextEpisode();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [autoSkip, introSkip, outroSkip, episodeId]);

  useEffect(() => {
    if (!lightsOff) return;
    document.body.style.backgroundColor = "#000";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [lightsOff]);

  useEffect(() => {
    if (!shortcuts) return;

    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const tag = active?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }
      const video = videoRef.current;
      if (!video) return;

      const dur = video.duration || 0;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
      case "ArrowLeft":
          e.preventDefault();
          wasPlayingBeforeSeekRef.current = !video.paused;
          seekingRef.current = true;
          video.currentTime = Math.max(0, video.currentTime - 15);
          break;
        case "ArrowRight":
          e.preventDefault();
          wasPlayingBeforeSeekRef.current = !video.paused;
          seekingRef.current = true;
          video.currentTime = Math.min(dur, video.currentTime + 15);
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
          handleFullscreen();
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shortcuts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loading type="detail" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loading type="detail" />
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <ErrorMessage message="Episode not found" />
      </div>
    );
  }

  const subEpisodes = anime.subEpisodesList;
  const dubEpisodes = anime.dubEpisodesList;
  const currentTrackList =
    trackType === "sub"
      ? subEpisodes
      : dubEpisodes.length > 0
        ? dubEpisodes
        : subEpisodes;
  const currentIndex = currentTrackList.findIndex((ep) => ep.id === episodeId);
  const canNext = currentIndex < currentTrackList.length - 1;

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Video Player */}
            <div
              ref={playerContainerRef}
              className="relative bg-black touch-manipulation"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(isPlaying ? false : true)}
              onDoubleClick={(e) => {
                e.preventDefault();
                handleFullscreen();
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === "VIDEO" || target.closest("video")) {
                  handlePlayPause();
                } else if (target === e.currentTarget) {
                  setShowControls((prev) => !prev);
                }
              }}
            >
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 px-4">
                  <p className="text-red-400 text-base sm:text-lg mb-2">Playback Error</p>
                  <p className="text-gray-300 text-xs sm:text-sm text-center mb-4">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-primary text-white text-xs sm:text-sm rounded-lg hover:bg-primary-hover transition"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full aspect-video"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => autoNext && goToNextEpisode()}
                playsInline
                preload="auto"
              />

              {/* Center Play Button */}
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-transform hover:scale-110 backdrop-blur-sm">
                    <FiPlay className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                  </div>
                </button>
              )}

              {/* Bottom Control Bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-2 px-3 transition-opacity duration-300 ${
                  showControls || !isPlaying
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                {/* Progress Bar */}
                <div className="mb-2 px-0.5">
                  <div
                    className="relative h-1 sm:h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      const newTime = pos * duration;
                      const video = videoRef.current;
                      if (video) {
                        wasPlayingBeforeSeekRef.current = !video.paused;
                        video.currentTime = newTime;
                      }
                      setCurrentTime(newTime);
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full pointer-events-none"
                      style={{
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={duration || 1}
                      step="0.1"
                      value={currentTime}
                      onMouseDown={() => {
                        seekingRef.current = true;
                        const video = videoRef.current;
                        if (video) wasPlayingBeforeSeekRef.current = !video.paused;
                      }}
                      onMouseUp={() => (seekingRef.current = false)}
                      onTouchStart={() => {
                        seekingRef.current = true;
                        const video = videoRef.current;
                        if (video) wasPlayingBeforeSeekRef.current = !video.paused;
                      }}
                      onTouchEnd={() => (seekingRef.current = false)}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        const newTime = parseFloat(target.value);
                        setCurrentTime(newTime);
                        if (videoRef.current) {
                          videoRef.current.currentTime = newTime;
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Left controls */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={handleSkipBackward}
                      className="flex items-center justify-center touch-manipulation min-w-[36px] min-h-[36px]"
                    >
                      <FiSkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    <button
                      onClick={handlePlayPause}
                      className="flex items-center justify-center touch-manipulation min-w-[36px] min-h-[36px]"
                    >
                      {isPlaying ? (
                        <FiPause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <FiPlay className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </button>

                    <button
                      onClick={handleSkipForward}
                      className="flex items-center justify-center touch-manipulation min-w-[36px] min-h-[36px]"
                    >
                      <FiSkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    <span className="text-white text-xs sm:text-sm font-medium">
                      EP {currentEpisode.number}
                    </span>

                    {canNext && (
                      <button
                        onClick={goToNextEpisode}
                        className="text-[10px] sm:text-xs text-gray-300 hover:text-white transition touch-manipulation hidden sm:inline"
                      >
                        Next Ep
                      </button>
                    )}
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Server selector */}
                    {servers.length > 1 && (
                      <select
                        aria-label="Select server"
                        value={activeProvider || ""}
                        onChange={(e) => selectServer(e.target.value)}
                        className="bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs border border-white/30 rounded px-1.5 sm:px-2 py-1 focus:outline-none focus:border-primary appearance-none cursor-pointer touch-manipulation"
                      >
                        {servers.map((s) => (
                          <option
                            key={s.provider}
                            value={s.provider}
                            className="bg-dark-800"
                          >
                            {favoriteServers.has(s.provider)
                              ? `★ ${s.label}`
                              : s.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Quality selector */}
                    {streamingSources.length > 1 && servers.length <= 1 && (
                      <select
                        aria-label="Select quality"
                        value={
                          selectedQuality
                            ? (streamingSources.indexOf(selectedQuality) >= 0
                              ? streamingSources.indexOf(selectedQuality)
                              : 0)
                            : 0
                        }
                        onChange={(e) => {
                          const idx = Number.parseInt(e.target.value, 10);
                          if (Number.isFinite(idx) && idx >= 0 && idx < streamingSources.length) {
                            setSelectedQuality(streamingSources[idx]);
                          }
                        }}
                        className="bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs border border-white/30 rounded px-1 sm:px-1.5 py-1 focus:outline-none focus:border-primary appearance-none cursor-pointer touch-manipulation"
                      >
                        {streamingSources.map((source, idx) => (
                          <option key={idx} value={idx} className="bg-dark-800">
                            {source.quality}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={handleFullscreen}
                      className="flex items-center justify-center touch-manipulation min-w-[36px] min-h-[36px]"
                    >
                      {isFullscreen ? (
                        <FiMinimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <FiMaximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Toggles Bar */}
            <div className="px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-4 overflow-x-auto bg-dark-900 border-t border-dark-800">
              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <span className="text-[10px] sm:text-xs text-gray-400">Autoplay</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoSkip}
                  onChange={(e) => setAutoSkip(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <span className="text-[10px] sm:text-xs text-gray-400">Auto Skip</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <span className="text-[10px] sm:text-xs text-gray-400">Auto Next</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={shortcuts}
                  onChange={(e) => setShortcuts(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <span className="text-[10px] sm:text-xs text-gray-400">Shortcuts</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={lightsOff}
                  onChange={(e) => setLightsOff(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <span className="text-[10px] sm:text-xs text-gray-400">Lights Off</span>
              </label>

              <button className="flex items-center gap-1 whitespace-nowrap text-[10px] sm:text-xs text-gray-400 hover:text-white transition">
                <FiSettings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Plyr
              </button>
            </div>

            {/* Episode Info Bar */}
            <div className="px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-dark-800/50 border-t border-dark-700">
              <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm">
                <FiList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Episode {currentEpisode.number}</span>
              </div>

              {/* SUB/DUB Toggle */}
              {anime && anime.subEpisodesList.length > 0 && dubAvailable && (
                <div className="flex bg-dark-700 rounded-lg p-0.5 border border-dark-600 self-end sm:self-auto">
                  <button
                    onClick={() => handleTrackTypeChange("sub")}
                    className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition ${
                      trackType === "sub"
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    SUB
                  </button>
                  <button
                    onClick={() => handleTrackTypeChange("dub")}
                    className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition ${
                      trackType === "dub"
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    DUB
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Episode Selector Sidebar - desktop */}
          <div className="hidden lg:block bg-dark-800/30 border-l border-dark-700 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="relative flex-1 min-w-0">
                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter episodes..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Server Selection */}
            {servers.length > 1 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <FiSettings className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Server</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {servers.map((s) => (
                    <button
                      key={s.provider}
                      onClick={() => selectServer(s.provider)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleFavoriteServer(s.provider);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition ${
                        activeProvider === s.provider
                          ? "bg-primary text-white"
                          : "bg-dark-700 text-gray-400 hover:text-white border border-dark-600 hover:border-primary/40"
                      }`}
                      title={`${s.label}${favoriteServers.has(s.provider) ? " (favorite)" : ""} — right-click to toggle favorite`}
                    >
                      {favoriteServers.has(s.provider) && (
                        <span className="text-yellow-400">★</span>
                      )}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {currentTrackList.map((ep) => {
                const isCurrent = ep.id === episodeId;
                return (
                  <div key={ep.id} className="relative group">
                    <button
                      onClick={() => handleEpisodeSelect(ep)}
                      className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-primary text-white border-2 border-primary"
                          : "bg-dark-700 text-gray-300 border border-dark-600 hover:border-primary/40 hover:bg-dark-600"
                      }`}
                    >
                      {isCurrent && canNext ? (
                        <FiPlay className="w-3 h-3 fill-current" />
                      ) : (
                        ep.number
                      )}
                    </button>

                    {/* Tooltip */}
                    {ep.title && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                          <p className="text-white text-xs font-medium">
                            EP {ep.number}: {ep.title}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-dark-700 border-r border-b border-dark-600 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Episode Info */}
            {canNext && currentTrackList[currentIndex + 1] && (
              <div className="mt-4 p-3 bg-dark-700/50 rounded-lg border border-dark-600">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <FiClock className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Episode {currentTrackList[currentIndex + 1].number}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Episode Grid - below video */}
        <div className="lg:hidden px-3 sm:px-6 py-4 sm:py-6 border-t border-dark-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
              Episodes
            </h2>
          </div>

          {/* Episode Filter/Search for mobile */}
          <div className="relative mb-3 sm:mb-4">
            <FiSearch className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter episodes..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Episode Grid for mobile */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:hidden gap-1.5 sm:gap-2">
            {currentTrackList.map((ep) => {
              const isCurrent = ep.id === episodeId;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeSelect(ep)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold transition-all relative ${
                    isCurrent
                      ? "bg-primary text-white border-2 border-primary"
                      : "bg-dark-800 text-gray-300 border border-dark-700 hover:border-primary/40"
                  }`}
                >
                  {isCurrent && canNext ? (
                    <FiPlay className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  ) : (
                    ep.number
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
