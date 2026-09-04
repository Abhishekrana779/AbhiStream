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

function firstQuery(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export async function searchAnime(req: Request, res: Response): Promise<void> {
  try {
    const q = firstQuery(req.query.q);
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
    const id = firstQuery(req.params.id);
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({ success: false, message: "Invalid anime id" });
      return;
    }
    const data: AnimeDetails = await miruroClient.getAnimeInfo(id);
    const response: ApiResponse<AnimeDetails> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch anime info";
    const status = /404|not found/i.test(message) ? 404 : 502;
    res.status(status).json({ success: false, message });
  }
}

export async function getEpisodeLinks(req: Request, res: Response): Promise<void> {
  try {
    const id = firstQuery(req.params.id);
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid anime id",
      });
      return;
    }
    const episodeNumberRaw = req.query.episode;
    const episodeNumber = Number.parseInt(
      typeof episodeNumberRaw === "string" ? episodeNumberRaw : "",
      10,
    );
    if (Number.isNaN(episodeNumber) || episodeNumber <= 0) {
      res.status(400).json({
        success: false,
        message: "Valid episode number is required",
      });
      return;
    }
    const categoryRaw = typeof req.query.category === "string" ? req.query.category : "sub";
    const category: "sub" | "dub" = categoryRaw === "dub" ? "dub" : "sub";
    const data = await miruroClient.getEpisodeLinks(id, episodeNumber, category);
    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch episode links";
    res.status(502).json({ success: false, message });
  }
}

export async function getStreamingSources(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = firstQuery(req.params.id);
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
    const genreId = firstQuery(req.params.genreId);
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

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || !parts.every((p) => Number.isFinite(p) && p >= 0 && p <= 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fe8") ||
      lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true;
  }
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice(7);
    if (isPrivateIPv4(mapped)) return true;
    if (mapped.startsWith("127.")) return true;
  }
  return false;
}

function isSafeProxyTarget(target: string): boolean {
  try {
    const u = new URL(target);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    let host = u.hostname.toLowerCase();
    if (host.startsWith("[") && host.endsWith("]")) {
      host = host.slice(1, -1);
    }
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    if (host.includes(":")) {
      if (isPrivateIPv6(host)) return false;
    } else {
      if (isPrivateIPv4(host)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function mapContentType(target: string, contentType?: string): string {
  if (isPlaylist(target, contentType)) {
    return "application/vnd.apple.mpegurl";
  }
  if (contentType && contentType.startsWith("video/")) return contentType;
  if (contentType && contentType.startsWith("audio/")) return contentType;
  const ctLower = (contentType || "").toLowerCase();
  if (
    /\.(ts|m2ts|mts)($|;|\?)/i.test(target) ||
    ctLower.includes("mpeg") ||
    ctLower.includes("mp2t")
  ) {
    return "video/mp2t";
  }
  if (/\.m4s($|;|\?)/i.test(target)) return "video/mp4";
  if (/\.aac($|;|\?)/i.test(target)) return "audio/aac";
  if (/\.key($|;|\?)/i.test(target)) return "application/octet-stream";
  if (contentType) return contentType;
  return "application/octet-stream";
}

function getOriginFromReferer(referer?: string): string | undefined {
    if (!referer) return undefined;
    try {
        return new URL(referer).origin;
    } catch {
        return undefined;
    }
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
  const target = firstQuery(req.query.url);
  const referer = firstQuery(req.query.referer) || undefined;
  if (!target) {
    res.status(400).json({ success: false, message: "Missing url param" });
    return;
  }

  if (!isSafeProxyTarget(target)) {
    res.status(400).json({ success: false, message: "Invalid proxy target" });
    return;
  }

  try {
    const controller = new AbortController();
    const onClientClose = (): void => {
      controller.abort();
    };
    req.on("close", onClientClose);

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      "sec-ch-ua": '"Chromium";v="120.0.0.0", "Google Chrome";v="120.0.0.0", "Not-A/Brand";v="8.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    };
    if (referer) {
      upstreamHeaders.Referer = referer;
      const origin = getOriginFromReferer(referer);
      if (origin) upstreamHeaders.Origin = origin;
    }
    if (req.headers.range) upstreamHeaders.Range = String(req.headers.range);
    if (req.headers["if-range"]) upstreamHeaders["If-Range"] = String(req.headers["if-range"]);

    const upstream = await axios.get(target, {
      headers: upstreamHeaders,
      responseType: "stream",
      timeout: 15000,
      maxRedirects: 5,
      signal: controller.signal,
      validateStatus: (status) => status < 500,
    });

    const onResponseClose = (): void => {
      controller.abort();
      upstream.data.destroy();
    };

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
    res.setHeader("Accept-Ranges", "bytes");

    if (upstream.status >= 400) {
      const message = `Upstream returned ${upstream.status}`;
      let detail = "";
      if (upstream.status === 403) {
        detail = " — the CDN rejected the request. This usually means the source URL has expired or the referer is blocked.";
      }
      if (upstream.status === 410) {
        detail = " — the upstream resource is gone. The stream URL has likely expired and is no longer available.";
      }
      if (!res.headersSent) {
        res.status(upstream.status);
        res.setHeader("Content-Type", "application/json");
        res.json({ success: false, message: message + detail });
      }
      req.off("close", onClientClose);
      res.off("close", onResponseClose);
      return;
    }

    const contentType = upstream.headers["content-type"] as string | undefined;

    if (isPlaylist(target, contentType)) {
      const chunks: Buffer[] = [];
      upstream.data.on("data", (chunk: Buffer) => chunks.push(chunk));
      let readTimer: ReturnType<typeof setTimeout> | undefined;
      await new Promise<void>((resolve, reject) => {
        readTimer = setTimeout(() => reject(new Error("manifest read timeout")), 15000);
        upstream.data.on("end", () => {
          clearTimeout(readTimer!);
          resolve();
        });
        upstream.data.on("error", (err: Error) => {
          clearTimeout(readTimer!);
          reject(err);
        });
        upstream.data.on("aborted", () => {
          clearTimeout(readTimer!);
          reject(new Error("manifest read aborted"));
        });
      });
      const body = Buffer.concat(chunks).toString("utf8");
      const rewritten = rewritePlaylist(body, target, referer);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(upstream.status).send(rewritten);
      req.off("close", onClientClose);
      res.off("close", onResponseClose);
      return;
    }

    res.status(upstream.status);
    res.setHeader("Content-Type", mapContentType(target, contentType));
    const contentLength = upstream.headers["content-length"];
    if (contentLength) {
      res.setHeader(
        "Content-Length",
        Array.isArray(contentLength) ? contentLength[0] : String(contentLength),
      );
    }
    const contentRange = upstream.headers["content-range"];
    if (contentRange) {
      res.setHeader(
        "Content-Range",
        Array.isArray(contentRange) ? contentRange[0] : String(contentRange),
      );
    }
    upstream.data.pipe(res);
    upstream.data.on("error", () => {
      if (!res.writableEnded) res.end();
    });
    res.on("close", onResponseClose);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; code?: string };
    if (err?.code === "ERR_CANCELED" || (error as Error)?.name === "CanceledError") {
      if (!res.headersSent) res.end();
      return;
    }
    const status = err?.response?.status || 502;
    const message =
      error instanceof Error ? error.message : "Failed to proxy stream";
    if (!res.headersSent) {
      res.status(status).json({ success: false, message });
    }
  } finally {
    req.removeAllListeners("close");
  }
}
