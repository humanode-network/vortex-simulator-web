import { apiPost } from "./http";

type CommandInput = {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};

export async function apiCommand<T>(input: CommandInput): Promise<T> {
  return await apiPost<T>(
    "/api/command",
    input,
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}
