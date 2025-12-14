import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/widget.tsx",
      name: "SmartServeWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
  },
});
