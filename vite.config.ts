import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/bootstrap/index.ts",
      name: "SmartServeWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    rollupOptions: {
      // Ensure React is bundled (widget must be fully self-contained)
      external: [],
    },
  },
});
