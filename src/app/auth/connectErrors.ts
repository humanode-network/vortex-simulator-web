export function formatAuthConnectError(input: { message: string }): string {
  const message = input.message;

  if (message.includes("HTTP 404")) {
    return "Wallet connection is temporarily unavailable. Please try again.";
  }

  if (
    message.includes("Failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("NetworkError") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ECONNRESET")
  ) {
    return "Unable to reach Vortex. Check your connection and try again.";
  }

  return message;
}
