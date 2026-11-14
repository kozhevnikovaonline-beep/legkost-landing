import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base: "./" — относительные пути, чтобы сборка работала в любой подпапке
// (GitHub Pages: /legkost-landing/app/, свой домен: /).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020", sourcemap: false, assetsInlineLimit: 0 },
  server: { host: true, port: 5173 },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
