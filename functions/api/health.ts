import { jsonResponse } from "../_lib/http.ts";

export const onRequest: ApiHandler = async () => {
  return jsonResponse({
    ok: true,
    service: "vortex-simulation-api",
    time: new Date().toISOString(),
  });
};
