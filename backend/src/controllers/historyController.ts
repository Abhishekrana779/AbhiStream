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
    const animeId = typeof req.body.animeId === "string" ? req.body.animeId : "";
    const episodeId = typeof req.body.episodeId === "string" ? req.body.episodeId : "";
    const animeTitle = typeof req.body.animeTitle === "string" ? req.body.animeTitle : "";
    const episodeNumber = typeof req.body.episodeNumber === "number" ? req.body.episodeNumber : 0;
    const episodeTitle = typeof req.body.episodeTitle === "string" ? req.body.episodeTitle : null;
    const poster = typeof req.body.poster === "string" ? req.body.poster : "";
    const progress = typeof req.body.progress === "number" ? req.body.progress : 0;
    const duration = typeof req.body.duration === "number" ? req.body.duration : 0;
    const completed = typeof req.body.completed === "boolean" ? req.body.completed : false;

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
      existing.progress = progress;
      existing.duration = duration;
      existing.completed = completed;
      existing.episodeNumber = episodeNumber;
      existing.episodeTitle = episodeTitle;
      existing.poster = poster;
      existing.animeTitle = animeTitle;
      await existing.save();
      const response: ApiResponse<typeof existing> = { success: true, data: existing };
      res.json(response);
      return;
    }

    let item;
    try {
      item = await History.create({
        userId: req.user!.userId,
        animeId,
        episodeId,
        animeTitle,
        episodeNumber,
        episodeTitle,
        poster,
        progress,
        duration,
        completed,
        watchedAt: new Date(),
      });
    } catch (createError: unknown) {
      const err = createError as { code?: number };
      if (err?.code === 11000) {
        const existing2 = await History.findOne({
          userId: req.user!.userId,
          animeId,
          episodeId,
        });
        if (existing2) {
          existing2.watchedAt = new Date();
          existing2.progress = progress;
          existing2.duration = duration;
          existing2.completed = completed;
          existing2.episodeNumber = episodeNumber;
          existing2.episodeTitle = episodeTitle;
          existing2.poster = poster;
          existing2.animeTitle = animeTitle;
          await existing2.save();
          const response: ApiResponse<typeof existing2> = { success: true, data: existing2 };
          res.json(response);
          return;
        }
      }
      throw createError;
    }

    const response: ApiResponse<typeof item> = { success: true, data: item };
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add history";
    res.status(500).json({ success: false, message });
  }
}

export async function updateHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const progress = req.body.progress;
    const duration = req.body.duration;
    const completed = req.body.completed;

    const item = await History.findOne({
      _id: req.params.id,
      userId: req.user!.userId,
    });

    if (!item) {
      res.status(404).json({ success: false, message: "History entry not found" });
      return;
    }

    if (typeof progress === "number") item.progress = progress;
    if (typeof duration === "number") item.duration = duration;
    if (typeof completed === "boolean") item.completed = completed;
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
