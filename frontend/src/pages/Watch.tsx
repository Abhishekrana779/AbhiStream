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
import type { AnimeDetails, Episode, StreamingSource } from "../types/anime";

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
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [trackType, setTrackType] = useState<TrackType>("sub");
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);
  const [lightsOff, setLightsOff] = useState(false);
  const seekingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  const wasPlayingBeforeSeekRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const proxySource = (url: string): string => {
    const params = new URLSearchParams({ url });
    const referer = streamingHeaders?.Referer;
    if (referer) params.set("referer", referer);
    return `/api/anime/stream?${params.toString()}`;
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
    const fetchData = async () => {
      if (!animeId || !episodeId) {
        setError("Episode not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const animeData = await animeApi.getInfo(animeId);
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

        const streaming = await animeApi.getStreamingSources(episodeId);
        setStreamingSources(streaming.sources);
        setStreamingHeaders(streaming.headers);

        if (streaming.sources.length > 0) {
          setSelectedQuality(streaming.sources[0]);
        }

        if (episode) {
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
          setHistoryId(historyItem._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load episode");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [animeId, episodeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedQuality) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.removeAttribute("src");
    video.load();

    let disposed = false;
    if (selectedQuality.isM3U8) {
      const absoluteSourceUrl = getAbsoluteProxyUrl(selectedQuality.url);

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
          if (!disposed && isPlayingRef.current) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
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
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = absoluteSourceUrl;
        video.addEventListener("loadedmetadata", () => {
          if (!disposed && isPlayingRef.current) {
            video.play().catch(() => {});
          }
        }, { once: true });
      }

      return () => {
        disposed = true;
        hlsRef.current?.destroy();
        hlsRef.current = null;
      };
    }

    video.src = getAbsoluteProxyUrl(selectedQuality.url);
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [selectedQuality, streamingHeaders]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current && historyId && duration > 0) {
        const progress = videoRef.current.currentTime;
        const completed = progress / duration > 0.9;

        try {
          if (Math.round(progress) % 10 === 0) {
            await historyApi.update(historyId, {
              progress,
              duration,
              completed,
            });
          }
        } catch {
          // Silently fail to not interrupt playback
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [historyId, duration]);

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
    video.currentTime = Math.max(0, video.currentTime - 15);
  }, []);

  const handleSkipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    wasPlayingBeforeSeekRef.current = !video.paused;
    video.currentTime = Math.min(duration, video.currentTime + 15);
  }, [duration]);

  const handleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {
        setIsFullscreen(false);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const goToNextEpisode = () => {
    if (!anime || !currentEpisode) return;
    const list = trackType === "sub" ? anime.subEpisodesList : anime.dubEpisodesList;
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
    const list =
      type === "sub" ? anime?.subEpisodesList : anime?.dubEpisodesList;
    const firstEp = list?.[0];
    if (firstEp && firstEp.id !== episodeId) {
      navigate(`/watch/${animeId}/${firstEp.id}`);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoSkip) return;

    const handleTimeUpdate = () => {
      if (video.currentTime < 30 && video.currentTime > 0) {
        video.currentTime = 30;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [autoSkip]);

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
      if (document.activeElement?.tagName === "INPUT") return;
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
          video.currentTime = Math.max(0, video.currentTime - 15);
          break;
        case "ArrowRight":
          e.preventDefault();
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

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!anime || !currentEpisode || !selectedQuality) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <ErrorMessage message="Episode not found" />
      </div>
    );
  }

  const subEpisodes = anime.subEpisodesList;
  const dubEpisodes = anime.dubEpisodesList;
  const currentTrackList =
    trackType === "sub" ? subEpisodes : dubEpisodes;
  const currentIndex = currentTrackList.findIndex((ep) => ep.id === episodeId);
  const canNext = currentIndex < currentTrackList.length - 1;

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden pt-[70px]">
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
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === "VIDEO" || target.closest("video")) {
                  handlePlayPause();
                } else if (target === e.currentTarget) {
                  setShowControls((prev) => !prev);
                }
              }}
            >
              <video
                ref={videoRef}
                className="w-full aspect-video"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => autoNext && goToNextEpisode()}
                crossOrigin="anonymous"
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
                        className="text-[10px] sm:text-xs text-gray-300 hover:text-white transition touch-manipulation hidden xs:inline"
                      >
                        Next Ep
                      </button>
                    )}
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {streamingSources.length > 1 && (
                      <select
                        value={streamingSources.indexOf(selectedQuality)}
                        onChange={(e) =>
                          setSelectedQuality(
                            streamingSources[parseInt(e.target.value)],
                          )
                        }
                        className="bg-transparent text-white text-[10px] sm:text-xs border border-white/30 rounded px-1 sm:px-1.5 py-0.5 focus:outline-none focus:border-primary appearance-none cursor-pointer touch-manipulation"
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
            <div className="px-3 sm:px-6 py-2.5 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 bg-dark-800/50 border-t border-dark-700">
              <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm">
                <FiList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Episode {currentEpisode.number}</span>
                <span className="text-gray-500 hidden sm:inline">In 6d 20h</span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-gray-500 hidden sm:inline">Sun, Sep 6, 04:34</span>
              </div>

              {/* SUB/DUB Toggle */}
              {anime && anime.subEpisodesList.length > 0 && anime.dubEpisodesList.length > 0 && (
                <div className="flex bg-dark-700 rounded-lg p-0.5 border border-dark-600 self-end xs:self-auto">
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
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter episodes..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>

              {/* SUB/DUB Toggle */}
              {anime && anime.subEpisodesList.length > 0 && anime.dubEpisodesList.length > 0 && (
                <div className="flex bg-dark-700 rounded-lg p-0.5 border border-dark-600">
                  <button
                    onClick={() => handleTrackTypeChange("sub")}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                      trackType === "sub"
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    SUB
                  </button>
                  <button
                    onClick={() => handleTrackTypeChange("dub")}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
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
            {canNext && (
              <div className="mt-4 p-3 bg-dark-700/50 rounded-lg border border-dark-600">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <FiClock className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Episode {currentTrackList[currentIndex + 1]?.number} In 6d 20h</p>
                    <p className="text-gray-500">Sun, Sep 6, 04:34</p>
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

            {/* SUB/DUB Toggle */}
            {anime && anime.subEpisodesList.length > 0 && anime.dubEpisodesList.length > 0 && (
              <div className="flex bg-dark-700 rounded-lg p-0.5 border border-dark-600">
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
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2">
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
