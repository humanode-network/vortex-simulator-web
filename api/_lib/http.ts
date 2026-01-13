export function jsonResponse(
  body: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {},
): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type"))
    headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return jsonResponse(
    {
      error: {
        message,
        ...(extra ?? {}),
      },
    },
    { status },
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Expected application/json request body");
  }
  return (await request.json()) as T;
}
