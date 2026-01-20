import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const isTest = process.env.RSTEST === "1";

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    ...(isTest ? { host: "127.0.0.1", port: 0 } : {}),
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
