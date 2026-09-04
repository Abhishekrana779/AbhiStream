import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), "").VITE_API_URL || "http://127.0.0.1:5000/api";
  const backendTarget = new URL(apiUrl).origin;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    server: {
      host: "0.0.0.0",
      allowedHosts: true,

      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          rewriteWsOrigin: true,
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});