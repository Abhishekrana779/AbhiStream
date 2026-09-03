import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: "0.0.0.0",
    allowedHosts: true,

    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        rewriteWsOrigin: true,
      },
      "/uploads": {
        target: process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});