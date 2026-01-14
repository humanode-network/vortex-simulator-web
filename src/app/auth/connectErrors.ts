export function formatAuthConnectError(input: { message: string }): string {
  const message = input.message;

  if (message.includes("HTTP 404")) {
    return "API is not available at `/api/*`. Start `vortex-simulator-server` (default `http://127.0.0.1:8788`) and ensure the web dev proxy targets it (override with `API_PROXY_TARGET`).";
  }

  if (
    message.includes("Failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("NetworkError") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ECONNRESET")
  ) {
    return "API is not reachable at `/api/*`. If you are running locally, start `vortex-simulator-server` and verify `/api/health` responds. If deployed, check the API service and reverse proxy.";
  }

  return message;
}
