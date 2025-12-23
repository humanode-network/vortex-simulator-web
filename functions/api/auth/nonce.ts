import { issueNonce } from "../../_lib/auth.ts";
import { errorResponse, jsonResponse, readJson } from "../../_lib/http.ts";

type Body = { address?: string };

export const onRequestPost: PagesFunction = async (context) => {
  let body: Body;
  try {
    body = await readJson<Body>(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const address = (body.address ?? "").trim();
  if (!address) return errorResponse(400, "Missing address");

  const headers = new Headers();
  try {
    const { nonce } = await issueNonce(
      headers,
      context.env,
      context.request.url,
      address,
    );
    return jsonResponse({ nonce }, { headers });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
