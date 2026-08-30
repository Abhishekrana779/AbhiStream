export interface HistoryItem {
  _id: string;
  userId: string;
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string | null;
  poster: string;
  progress: number;
  duration: number;
  completed: boolean;
  watchedAt: string;
}

export interface HistoryPayload {
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string | null;
  poster: string;
  progress: number;
  duration: number;
  completed: boolean;
}