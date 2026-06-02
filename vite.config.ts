import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173, // optional, biar konsisten
    proxy: {
      // Proxy semua API biasa
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ""), // optional: kalau backend tidak pakai prefix /api
      },

      // KHUSUS UNTUK SOCKET.IO — ini yang paling penting!
      '/socket.io': {
        target: 'http://localhost:5000', // Ganti dengan URL backend Anda
        ws: true,
      },
    },
  },
});