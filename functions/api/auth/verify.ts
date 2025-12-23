import { issueSession, verifyNonceCookie } from "../../_lib/auth.ts";
import { envBoolean } from "../../_lib/env.ts";
import { errorResponse, jsonResponse, readJson } from "../../_lib/http.ts";

type Body = {
  address?: string;
  nonce?: string;
  signature?: string;
};

export const onRequestPost: PagesFunction = async (context) => {
  let body: Body;
  try {
    body = await readJson<Body>(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const address = (body.address ?? "").trim();
  const nonce = (body.nonce ?? "").trim();
  const signature = (body.signature ?? "").trim();
  if (!address) return errorResponse(400, "Missing address");
  if (!nonce) return errorResponse(400, "Missing nonce");
  if (!signature) return errorResponse(400, "Missing signature");

  const nonceToken = await verifyNonceCookie(context.request, context.env);
  if (!nonceToken)
    return errorResponse(
      401,
      "Nonce expired or missing; call /api/auth/nonce again",
    );
  if (nonceToken.address !== address)
    return errorResponse(401, "Nonce was issued for a different address");
  if (nonceToken.nonce !== nonce) return errorResponse(401, "Nonce mismatch");

  if (!envBoolean(context.env, "DEV_BYPASS_SIGNATURE")) {
    return errorResponse(
      501,
      "Signature verification is not implemented yet; set DEV_BYPASS_SIGNATURE=true to continue locally.",
    );
  }

  const headers = new Headers();
  await issueSession(headers, context.env, context.request.url, address);
  return jsonResponse({ ok: true, address }, { headers });
};
