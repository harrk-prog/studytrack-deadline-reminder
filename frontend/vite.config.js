import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Hanya untuk development: request /api/* diteruskan ke backend. Di production,
    // frontend dan API disajikan Express dari origin yang sama, jadi proxy ini tidak dipakai.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  }
});
