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

const isProduction = process.env.NODE_ENV === "production";

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGO_URI;

if (!jwtSecret) {
  console.error("FATAL: JWT_SECRET is not set.");
  process.exit(1);
}

if (!mongoUri) {
  console.error("FATAL: MONGO_URI is not set.");
  process.exit(1);
}

const miruroApiUrl = process.env.MIRURO_API_URL?.trim();

if (!miruroApiUrl) {
  console.error("FATAL: MIRURO_API_URL is not set.");
  process.exit(1);
}

const streamApiUrl =
  process.env.STREAM_API_URL?.trim() ||
  miruroApiUrl;

const clientUrl =
  process.env.CLIENT_URL?.trim() ||
  (isProduction ? "" : "http://localhost:5173");

const allowedOrigins = parseOrigins(
  process.env.ALLOWED_ORIGINS,
  isProduction ? [] : defaultOrigins
);

if (isProduction && !clientUrl) {
  console.warn(
    "WARN: CLIENT_URL is not set in production. CORS may block frontend requests."
  );
}

const mergedAllowedOrigins = clientUrl
  ? [...new Set([clientUrl, ...allowedOrigins])]
  : allowedOrigins;

export const env = {
  // Render automatically provides PORT.
  // Local development falls back to 5000.
  PORT: parseInt(process.env.PORT || "5000", 10),

  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: mongoUri,

  JWT_SECRET: jwtSecret,

  MIRURO_API_URL: miruroApiUrl,

  STREAM_API_URL: streamApiUrl,

  CLIENT_URL: clientUrl,

  ALLOWED_ORIGINS: mergedAllowedOrigins,
};