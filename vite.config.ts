import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/savey-api": {
        target: "https://savey.az",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/savey-api/, ""),
      },
    },
  },
});
