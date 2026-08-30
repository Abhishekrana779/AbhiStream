import { Response } from "express";
import History from "../models/History";
import { AuthRequest } from "../middleware/authMiddleware";
import type { ApiResponse } from "../types";

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await History.find({ userId: req.user!.userId }).sort({ watchedAt: -1 });
    const response: ApiResponse<typeof items> = { success: true, data: items };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch history";
    res.status(500).json({ success: false, message });
  }
}

export async function addHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { animeId, episodeId, animeTitle, episodeNumber, episodeTitle, poster, progress, duration, completed } = req.body;

    if (!animeId || !episodeId || !animeTitle) {
      res.status(400).json({ success: false, message: "Anime ID, episode ID, and anime title are required" });
      return;
    }

    const existing = await History.findOne({
      userId: req.user!.userId,
      animeId,
      episodeId,
    });

    if (existing) {
      existing.watchedAt = new Date();
      await existing.save();
      const response: ApiResponse<typeof existing> = { success: true, data: existing };
      res.json(response);
      return;
    }

    const item = await History.create({
      userId: req.user!.userId,
      animeId,
      episodeId,
      animeTitle,
      episodeNumber: episodeNumber || 0,
      episodeTitle: episodeTitle || null,
      poster: poster || "",
      progress: progress || 0,
      duration: duration || 0,
      completed: completed || false,
      watchedAt: new Date(),
    });

    const response: ApiResponse<typeof item> = { success: true, data: item };
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add history";
    res.status(500).json({ success: false, message });
  }
}

export async function updateHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { progress, duration, completed } = req.body;

    const item = await History.findOne({
      _id: req.params.id,
      userId: req.user!.userId,
    });

    if (!item) {
      res.status(404).json({ success: false, message: "History entry not found" });
      return;
    }

    if (progress !== undefined) item.progress = progress;
    if (duration !== undefined) item.duration = duration;
    if (completed !== undefined) item.completed = completed;
    item.watchedAt = new Date();
    await item.save();

    const response: ApiResponse<typeof item> = { success: true, data: item };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update history";
    res.status(500).json({ success: false, message });
  }
}

export async function deleteHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await History.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.userId,
    });

    if (!result) {
      res.status(404).json({ success: false, message: "History entry not found" });
      return;
    }

    res.json({ success: true, message: "History entry removed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete history";
    res.status(500).json({ success: false, message });
  }
}

export async function clearHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    await History.deleteMany({ userId: req.user!.userId });
    res.json({ success: true, message: "History cleared" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear history";
    res.status(500).json({ success: false, message });
  }
}
