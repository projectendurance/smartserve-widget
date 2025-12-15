import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // prevents "process is not defined" in browser
  },
  build: {
    lib: {
      entry: "src/bootstrap/index.ts",
      name: "SmartServeWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    rollupOptions: { external: [] },
  },
});
