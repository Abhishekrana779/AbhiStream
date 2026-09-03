import { Router } from "express";
import {
  getTrending,
  getPopular,
  getLatest,
  getUpcoming,
  getSpotlight,
  searchAnime,
  getAnimeInfo,
  getStreamingSources,
  getEpisodeLinks,
  getGenres,
  getGenreAnime,
  proxyStream,
} from "../controllers/animeController";

const router = Router();

// Specific routes must come before generic :id routes
router.get("/trending", getTrending);
router.get("/popular", getPopular);
router.get("/latest", getLatest);
router.get("/upcoming", getUpcoming);
router.get("/spotlight", getSpotlight);
router.get("/search", searchAnime);
router.get("/genres", getGenres);
router.get("/genre/:genreId", getGenreAnime);
router.get("/stream", proxyStream);
router.get("/:id/episodes", getEpisodeLinks);
router.get("/:id/streaming", getStreamingSources);
router.get("/:id", getAnimeInfo);

export default router;
