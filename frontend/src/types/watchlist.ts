export interface WatchlistItem {
  _id: string;
  userId: string;
  animeId: string;
  title: string;
  poster: string;
  status: string | null;
  createdAt: string;
}