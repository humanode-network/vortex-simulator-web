import { clearSession } from "../../_lib/auth.ts";
import { jsonResponse } from "../../_lib/http.ts";

export const onRequestPost: PagesFunction = async (context) => {
  const headers = new Headers();
  await clearSession(headers, context.env, context.request.url);
  return jsonResponse({ ok: true }, { headers });
};
