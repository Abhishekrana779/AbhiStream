import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const YTDLP_PATH = path.join(__dirname, "..", "yt-dlp");
const DOWNLOADS_DIR = path.join(__dirname, "..", "downloads");

const execFileAsync = promisify(execFile);

interface VideoFormat {
  quality: string;
  format: string;
  ext: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  formats: VideoFormat[];
}

interface YtdlpFormat {
  ext: string;
  height?: number;
  format_id?: string;
}

interface YtdlpVideoData {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  formats?: YtdlpFormat[];
}

function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  try {
    const { stdout } = await execFileAsync(YTDLP_PATH, ["-J", url]);

    const data = JSON.parse(stdout) as YtdlpVideoData;

    const formats = (data.formats || [])
      .filter(
        (item) =>
          item.ext === "mp4" &&
          item.height &&
          item.format_id,
      )
      .map(
        (item): VideoFormat => ({
          quality: `${item.height}p`,
          format: item.format_id!,
          ext: item.ext,
        }),
      );

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      duration: formatDuration(data.duration),
      uploader: data.uploader,
      formats,
    };
  } catch (error) {
    throw error;
  }
}

export async function downloadVideoFile(
  url: string,
  quality: string,
): Promise<string> {
  try {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const output = path.join(DOWNLOADS_DIR, `video-${Date.now()}.mp4`);

    await execFileAsync(YTDLP_PATH, [
      "-f",
      `${quality}+bestaudio/best`,
      "-o",
      output,
      url,
    ]);

    return output;
  } catch (error) {
    throw error;
  }
}
