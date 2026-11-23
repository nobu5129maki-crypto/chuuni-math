import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * - Vercel などドメイン直下: unset または /
 * - GitHub Pages プロジェクトサイト: VITE_DEPLOY_BASE=/chuuni-math/（リポジトリ名と一致）
 */
function deployBase(mode: string): string {
  if (mode !== "production") return "/";
  const raw = process.env.VITE_DEPLOY_BASE?.trim();
  if (!raw || raw === "/") return "/";
  if (raw === "." || raw === "./") return "./";
  const withLead = raw.startsWith("/") ? raw : `/${raw}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}

export default defineConfig(({ mode }) => {
  const base = deployBase(mode);
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifestFilename: base === "./" ? "manifest.json" : "manifest.webmanifest",
        includeAssets: [
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-192.png",
          "pwa-maskable-512.png",
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
              purpose: "any",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "pwa-maskable-512.png",
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
