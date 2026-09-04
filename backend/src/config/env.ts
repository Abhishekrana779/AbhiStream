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

if (!jwtSecret) {
  console.error("FATAL: JWT_SECRET is not set.");
  process.exit(1);
}

if (!mongoUri) {
  console.error("FATAL: MONGO_URI is not set.");
  process.exit(1);
}

const streamApiUrl = process.env.STREAM_API_URL?.trim();
const miruroApiUrl = process.env.MIRURO_API_URL?.trim() || "https://mirurotvapi.vercel.app/api";

const clientUrl = process.env.CLIENT_URL?.trim() || (isProduction ? "" : "http://localhost:5173");
const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS, isProduction ? [] : defaultOrigins);

if (isProduction && !clientUrl) {
  console.warn("WARN: CLIENT_URL is not set in production. CORS may block frontend requests.");
}

const mergedAllowedOrigins = clientUrl
  ? [...new Set([clientUrl, ...allowedOrigins])]
  : allowedOrigins;

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: mongoUri as string,

  JWT_SECRET: jwtSecret as string,

  MIRURO_API_URL: miruroApiUrl,

  // The repository includes Miruro-API for local development. Falling back to
  // it prevents the Watch page from silently returning an empty source list
  // when STREAM_API_URL was omitted from a local .env file.
  STREAM_API_URL: streamApiUrl || (isProduction ? "" : "http://127.0.0.1:8000"),

  CLIENT_URL: clientUrl,

  ALLOWED_ORIGINS: mergedAllowedOrigins,
};
