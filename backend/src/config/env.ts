import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/abhistream",
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_change_me",
  MIRURO_API_URL: process.env.MIRURO_API_URL || "https://mirurotvapi.vercel.app/api",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};