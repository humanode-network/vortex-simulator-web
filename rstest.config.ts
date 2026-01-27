import { defineConfig } from "@rstest/core";
import type { RsbuildPlugin } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const rstestServerPlugin = (): RsbuildPlugin => ({
  name: "rstest:server-host",
  setup(api) {
    api.modifyRsbuildConfig((config) => {
      config.server = {
        ...config.server,
        host: "127.0.0.1",
        port: 0,
        strictPort: false,
        middlewareMode: true,
      };
      return config;
    });
  },
});

export default defineConfig({
  testMatch: ["tests/**/*.test.js"],
  environment: "node",
  browser: { enabled: false },
  plugins: [pluginReact(), rstestServerPlugin()],
});
