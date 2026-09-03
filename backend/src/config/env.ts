import dotenv from "dotenv";

dotenv.config();

function parseOrigins(
  value: string | undefined,
  fallback: string[]
): string[] {
  if (!value) return fallback;

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const isProduction = process.env.NODE_ENV === "production";

const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGO_URI;

if (isProduction && !jwtSecret) {
  console.error("FATAL: JWT_SECRET is not set in production.");
  process.exit(1);
}

if (!mongoUri) {
  console.error("FATAL: MONGO_URI is not set.");
  process.exit(1);
}

const streamApiUrl = process.env.STREAM_API_URL?.trim();
const miruroApiUrl = process.env.MIRURO_API_URL?.trim() || "https://mirurotvapi.vercel.app/api";

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: mongoUri as string,

  JWT_SECRET: jwtSecret as string,

  MIRURO_API_URL: miruroApiUrl,

  STREAM_API_URL: streamApiUrl || "",

  CLIENT_URL:
    process.env.CLIENT_URL ||
    (isProduction ? "" : "http://localhost:5173"),

  ALLOWED_ORIGINS: parseOrigins(
    process.env.ALLOWED_ORIGINS,
    isProduction ? [] : defaultOrigins
  ),
};