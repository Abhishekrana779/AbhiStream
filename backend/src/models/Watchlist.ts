import mongoose, { Schema, Document } from "mongoose";

export interface IWatchlist extends Document {
  userId: string;
  animeId: string;
  title: string;
  poster: string;
  status: string | null;
  addedAt: Date;
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    animeId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

watchlistSchema.index({ userId: 1, animeId: 1 }, { unique: true });

export default mongoose.model<IWatchlist>("Watchlist", watchlistSchema);