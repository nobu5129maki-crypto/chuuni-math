import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** GitHub Pages プロジェクトサイト: https://nobu5129maki-crypto.github.io/chuuni-math/ */
const SITE_BASE = "/chuuni-math/";

export default defineConfig(({ mode }) => {
  const base = mode === "production" ? SITE_BASE : "/";
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "pwa-192x192.png",
          "pwa-512x512.png",
          "apple-touch-icon.png",
        ],
        manifest: {
          name: "数チャレ！中2マスター",
          short_name: "数チャレ",
          description: "中学2年生向けの数学ドリル",
          lang: "ja",
          start_url: base,
          scope: base,
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0c1220",
        background_color: "#0c1220",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  };
});
