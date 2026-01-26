/// <reference types="@rsbuild/core/types" />

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

import "./styles/global.css";
import "./styles/base.css";
import { initTheme } from "./lib/theme";

type RuntimeConfig = {
  apiBaseUrl?: string;
  apiHeaders?: Record<string, string>;
  apiCredentials?: RequestCredentials;
};

async function loadRuntimeConfig(): Promise<void> {
  if (typeof window === "undefined") return;
  const target = window as typeof window & {
    __VORTEX_CONFIG__?: RuntimeConfig;
  };
  if (target.__VORTEX_CONFIG__) return;
  try {
    const res = await fetch("/vortex-config.json", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as unknown;
    if (json && typeof json === "object") {
      target.__VORTEX_CONFIG__ = json as RuntimeConfig;
    }
  } catch {
    // Ignore missing runtime config.
  }
}

async function bootstrap(): Promise<void> {
  await loadRuntimeConfig();
  initTheme("sky");

  const rootEl = document.getElementById("root");
  if (rootEl === null) {
    throw new Error("no root");
  }

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
