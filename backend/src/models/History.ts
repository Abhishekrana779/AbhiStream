import mongoose, { Schema, Document } from "mongoose";

export interface IHistory extends Document {
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
  watchedAt: Date;
}

const historySchema = new Schema<IHistory>(
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
    episodeId: {
      type: String,
      required: true,
    },
    animeTitle: {
      type: String,
      required: true,
    },
    episodeNumber: {
      type: Number,
      default: 0,
    },
    episodeTitle: {
      type: String,
      default: null,
    },
    poster: {
      type: String,
      default: "",
    },
    progress: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

historySchema.index({ userId: 1, animeId: 1, episodeId: 1 }, { unique: true });

export default mongoose.model<IHistory>("History", historySchema);
