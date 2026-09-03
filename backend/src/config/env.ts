import dotenv from "dotenv";
dotenv.config();

function parseOrigins(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const defaultOrigins = ["http://localhost:5173", "http://localhost:3000"];

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "fallback_secret_change_me";
if (isProduction && (!process.env.JWT_SECRET || jwtSecret === "fallback_secret_change_me")) {
  console.error("FATAL: JWT_SECRET is not set or is using the insecure default in production.");
  process.exit(1);
}

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/abhistream",
  JWT_SECRET: jwtSecret,
  MIRURO_API_URL: process.env.MIRURO_API_URL || "https://mirurotvapi.vercel.app/api",
  STREAM_API_URL: process.env.STREAM_API_URL || "https://anivexa-api.vercel.app",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  ALLOWED_ORIGINS: parseOrigins(process.env.ALLOWED_ORIGINS, defaultOrigins),
};