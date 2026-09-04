import { Response } from "express";
import Watchlist from "../models/Watchlist";
import { AuthRequest } from "../middleware/authMiddleware";
import type { ApiResponse } from "../types";

export async function getWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await Watchlist.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    const response: ApiResponse<typeof items> = { success: true, data: items };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch watchlist";
    res.status(500).json({ success: false, message });
  }
}

export async function addToWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const animeId = typeof req.body.animeId === "string" ? req.body.animeId : "";
    const title = typeof req.body.title === "string" ? req.body.title : "";
    const poster = typeof req.body.poster === "string" ? req.body.poster : "";
    const status = typeof req.body.status === "string" ? req.body.status : null;

    if (!animeId || !title) {
      res.status(400).json({ success: false, message: "Anime ID and title are required" });
      return;
    }

    const existing = await Watchlist.findOne({
      userId: req.user!.userId,
      animeId,
    });

    if (existing) {
      res.status(409).json({ success: false, message: "Anime already in watchlist" });
      return;
    }

    const item = await Watchlist.create({
      userId: req.user!.userId,
      animeId,
      title,
      poster,
      status,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to watchlist";
    res.status(500).json({ success: false, message });
  }
}

export async function removeFromWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { animeId } = req.params;

    const result = await Watchlist.findOneAndDelete({
      userId: req.user!.userId,
      animeId,
    });

    if (!result) {
      res.status(404).json({ success: false, message: "Anime not found in watchlist" });
      return;
    }

    res.json({ success: true, message: "Removed from watchlist" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove from watchlist";
    res.status(500).json({ success: false, message });
  }
}

export async function checkWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { animeId } = req.params;

    const item = await Watchlist.findOne({
      userId: req.user!.userId,
      animeId,
    });

    res.json({
      success: true,
      data: { isInWatchlist: !!item },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check watchlist";
    res.status(500).json({ success: false, message });
  }
}