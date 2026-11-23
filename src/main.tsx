import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// エックスサーバーではログイン画面と同じ、本体をキャッシュしない sw.js を使う。
if (import.meta.env.VITE_XSERVER === "1") {
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("./sw.js", { scope: "./" });
  }
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
