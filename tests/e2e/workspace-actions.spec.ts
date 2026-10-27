import { expect, test } from "@playwright/test";

import type { FactionDto, InitiativeDto } from "../../src/types/api";

const address = "hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W";
const timestamp = "2026-10-27T09:00:00.000Z";

for (const kind of ["initiative", "faction"] as const) {
  test(`${kind} actions retain error recovery and reload after the shared runner refactor`, async ({
    page,
  }) => {
    let member = false;
    let failNext = true;
    let writes = 0;
    let reads = 0;
    const id = `test-${kind}-actions`;
    const pathname = `/api/${kind}s/${id}`;
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === "/api/me")
        return route.fulfill({
          json: {
            authenticated: true,
            address,
            gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
          },
        });
      if (path === pathname) {
        reads += 1;
        const faction: FactionDto = {
          id,
          name: "Research faction",
          description: "Coordinate public research.",
          visibility: "public",
          members: member ? 1 : 0,
          acm: "0",
          focus: "Research",
          goals: [],
          tags: [],
          initiatives: [],
          roster: [],
          memberships: member
            ? [{ address, role: "member", isActive: true, joinedAt: timestamp }]
            : [],
        };
        const initiative: InitiativeDto = {
          id,
          slug: id,
          title: "Research initiative",
          summary: "Coordinate public research.",
          description: "",
          visibility: "public",
          status: "active",
          tags: [],
          createdByAddress: "0xworkspace-owner",
          createdAt: timestamp,
          updatedAt: timestamp,
          admins: [],
          stewards: [],
          memberCount: member ? 1 : 0,
          viewerRole: member ? "member" : null,
          viewerCanJoin: !member,
          viewerCanLeave: member,
        };
        return route.fulfill({
          json: kind === "initiative" ? initiative : faction,
        });
      }
      if (path === "/api/command") {
        writes += 1;
        if (failNext) {
          failNext = false;
          return route.fulfill({
            status: 503,
            json: { error: { message: "Please retry this action." } },
          });
        }
        const command = request.postDataJSON();
        expect(command.type).toBe(`${kind}.${member ? "leave" : "join"}`);
        member = !member;
        return route.fulfill({ json: { ok: true } });
      }
      return route.fulfill({ json: { items: [] } });
    });
    await page.goto(`/app/${kind}s/${id}`);
    const join = page.getByRole("button", {
      name: `Join ${kind}`,
      exact: true,
    });
    await expect(join).toBeEnabled();
    const initialReads = reads;
    await join.click();
    await expect(
      page.getByText("Please retry this action.", { exact: true }),
    ).toBeVisible();
    await expect(join).toBeEnabled();
    expect(reads).toBe(initialReads);
    await join.click();
    const leave = page.getByRole("button", {
      name: `Leave ${kind}`,
      exact: true,
    });
    await expect(leave).toBeEnabled();
    await expect(
      page.getByText("Please retry this action.", { exact: true }),
    ).toHaveCount(0);
    await leave.click();
    await expect(join).toBeEnabled();
    expect(writes).toBe(3);
    expect(reads).toBe(initialReads + 2);
  });
}
