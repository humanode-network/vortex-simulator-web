import * as z from "zod/mini";
import { apiGet } from "./http";

export const networkShareSchema = z.object({
  percent: z.number().check(z.gte(0), z.lte(100)),
  activeHumanNodes: z.int().check(z.gte(0)),
  humanNodeActive: z.boolean(),
  finalizedBlockHash: z.string().check(z.regex(/^0x[0-9a-f]{64}$/i)),
  checkedAt: z.iso.datetime(),
});

export type NetworkShareDto = z.infer<typeof networkShareSchema>;

export async function apiNetworkShare(): Promise<NetworkShareDto> {
  return networkShareSchema.parse(
    await apiGet<unknown>("/api/my-governance/network-share"),
  );
}
