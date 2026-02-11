import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "..");

function parseEnvFile(filepath) {
  const content = readFileSync(filepath, "utf8");
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;
    const key = trimmed.slice(0, equalIndex).trim();
    const rawValue = trimmed.slice(equalIndex + 1).trim();
    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    out[key] = unquoted;
  }
  return out;
}

function loadLocalEnv(filepath) {
  if (!existsSync(filepath)) return;
  const values = parseEnvFile(filepath);
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

const envPathArg = process.argv.find((arg) => arg.startsWith("--env="));
const envPath = envPathArg
  ? envPathArg.slice("--env=".length)
  : resolve(rootDir, ".env.local");
loadLocalEnv(envPath);

process.env.API_PROXY_TARGET ??= "http://127.0.0.1:8788";

const child = spawn("yarn", ["dev"], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
