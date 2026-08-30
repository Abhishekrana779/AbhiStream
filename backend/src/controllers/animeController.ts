import axios from "axios";
import { Request, Response } from "express";
import { miruroClient } from "../services/miruroClient";
import type {
  ApiResponse,
  PaginatedAnime,
  AnimeDetails,
  Genre,
} from "../types";

function getPage(value: unknown): number {
  const page = Number.parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function getTrending(req: Request, res: Response): Promise<void> {
  try {
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.getTrending(page);
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trending anime";
    res.status(502).json({ success: false, message });
  }
}

export async function getPopular(req: Request, res: Response): Promise<void> {
  try {
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.getPopular(page);
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch popular anime";
    res.status(502).json({ success: false, message });
  }
}

export async function getLatest(req: Request, res: Response): Promise<void> {
  try {
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.getLatest(page);
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch latest episodes";
    res.status(502).json({ success: false, message });
  }
}

export async function getUpcoming(req: Request, res: Response): Promise<void> {
  try {
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.getUpcoming(page);
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch upcoming anime";
    res.status(502).json({ success: false, message });
  }
}

export async function getSpotlight(req: Request, res: Response): Promise<void> {
  try {
    const data = await miruroClient.getSpotlight();
    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch spotlight";
    res.status(502).json({ success: false, message });
  }
}

export async function searchAnime(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      res
        .status(400)
        .json({ success: false, message: "Search query is required" });
      return;
    }
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.searchAnime(q, page);
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search anime";
    res.status(502).json({ success: false, message });
  }
}

export async function getAnimeInfo(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "Anime ID is required" });
      return;
    }
    const data: AnimeDetails = await miruroClient.getAnimeInfo(id);
    const response: ApiResponse<AnimeDetails> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch anime info";
    res.status(502).json({ success: false, message });
  }
}

export async function getStreamingSources(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res
        .status(400)
        .json({ success: false, message: "Episode ID is required" });
      return;
    }
    const data = await miruroClient.getStreamingSources(id);
    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch streaming sources";
    res.status(502).json({ success: false, message });
  }
}

export async function getGenres(_req: Request, res: Response): Promise<void> {
  try {
    const data: Genre[] = await miruroClient.getGenres();
    const response: ApiResponse<Genre[]> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch genres";
    res.status(502).json({ success: false, message });
  }
}

export async function getGenreAnime(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { genreId } = req.params;
    if (!genreId) {
      res.status(400).json({ success: false, message: "Genre ID is required" });
      return;
    }
    const page = getPage(req.query.page);
    const data: PaginatedAnime = await miruroClient.getGenreAnime(
      genreId,
      page,
    );
    const response: ApiResponse<PaginatedAnime> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch genre anime";
    res.status(502).json({ success: false, message });
  }
}

function isPlaylist(target: string, contentType?: string): boolean {
  const combined = `${target} ${contentType || ""}`.toLowerCase();
  return (
    combined.includes("m3u8") || combined.includes("mpegurl")
  );
}

function mapContentType(target: string, contentType?: string): string {
  if (isPlaylist(target, contentType)) {
    return "application/vnd.apple.mpegurl";
  }
  if (contentType && contentType.startsWith("video/")) return contentType;
  if (/\.ts($|;|\?)/i.test(target)) return "video/mp2t";
  if (/\.m4s($|;|\?)/i.test(target)) return "video/mp4";
  if (/\.aac($|;|\?)/i.test(target)) return "audio/aac";
  if (/\.key($|;|\?)/i.test(target)) return "application/octet-stream";
  if (contentType) return contentType;
  return "application/octet-stream";
}

function buildProxyUrl(target: string, referer?: string): string {
  const params = new URLSearchParams();
  params.set("url", target);
  if (referer) params.set("referer", referer);
  return `/api/anime/stream?${params.toString()}`;
}

function rewritePlaylist(
  text: string,
  baseUrl: string,
  referer?: string,
): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const uriAttr = /URI="([^"]+)"/.exec(line);
      if (uriAttr) {
        const resolved = new URL(uriAttr[1], baseUrl).href;
        return line.replace(uriAttr[0], `URI="${buildProxyUrl(resolved, referer)}"`);
      }
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        try {
          return buildProxyUrl(new URL(trimmed, baseUrl).href, referer);
        } catch {
          return line;
        }
      }
      return line;
    })
    .join("\n");
}

export async function proxyStream(req: Request, res: Response): Promise<void> {
  const target = (req.query.url as string) || "";
  const referer = (req.query.referer as string) || undefined;
  if (!target) {
    res.status(400).json({ success: false, message: "Missing url param" });
    return;
  }

  try {
    const upstream = await axios.get(target, {
      headers: referer ? { Referer: referer } : {},
      responseType: "stream",
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Accept-Ranges", "bytes");

    const contentType = upstream.headers["content-type"] as string | undefined;

    if (isPlaylist(target, contentType)) {
      const chunks: Buffer[] = [];
      upstream.data.on("data", (chunk: Buffer) => chunks.push(chunk));
      let readTimer: ReturnType<typeof setTimeout>;
      await new Promise<void>((resolve, reject) => {
        readTimer = setTimeout(() => reject(new Error("manifest read timeout")), 15000);
        upstream.data.on("end", () => {
          clearTimeout(readTimer);
          resolve();
        });
        upstream.data.on("error", (err: Error) => {
          clearTimeout(readTimer);
          reject(err);
        });
        upstream.data.on("aborted", () => {
          clearTimeout(readTimer);
          reject(new Error("manifest read aborted"));
        });
      });
      const body = Buffer.concat(chunks).toString("utf8");
      const rewritten = rewritePlaylist(body, target, referer);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(upstream.status).send(rewritten);
      return;
    }

    res.setHeader("Content-Type", mapContentType(target, contentType));
    const contentLength = upstream.headers["content-length"];
    if (contentLength) {
      res.setHeader(
        "Content-Length",
        Array.isArray(contentLength) ? contentLength[0] : String(contentLength),
      );
    }
    upstream.data.pipe(res);
    upstream.data.on("error", () => res.end());
  } catch (error: any) {
    const status = error?.response?.status || 502;
    const message =
      error instanceof Error ? error.message : "Failed to proxy stream";
    res.status(status).json({ success: false, message });
  }
}
