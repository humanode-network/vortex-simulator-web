import { test, expect } from "@rstest/core";

import {
  findViewerFactionMembership,
  getFactionViewerPermissions,
  hasActiveFactionMembership,
  type FactionMembership,
} from "../../src/lib/factionUi";

const genericAddress = "5C62Ck4UrFPiBtoCmeSrgF7x9yv9mn38446dhCpsi2mLHiFT";
const canonicalAddress = "hmnVXRhJsFLh5CbdxZNrn5Lu6FR2nDacxgSLrsVoyoW9ERXAP";

const memberships: FactionMembership[] = [
  {
    address: "0xInactive",
    role: "member",
    isActive: false,
    joinedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    address: canonicalAddress,
    role: "steward",
    isActive: true,
    joinedAt: "2026-01-02T00:00:00.000Z",
  },
];

test("findViewerFactionMembership resolves same-key SS58 encodings", () => {
  expect(findViewerFactionMembership(memberships, genericAddress)?.role).toBe(
    "steward",
  );
});

test("active faction membership helpers honor inactive rows", () => {
  expect(findViewerFactionMembership(memberships, "0xinactive")?.role).toBe(
    "member",
  );
  expect(
    findViewerFactionMembership(memberships, "0xinactive", {
      activeOnly: true,
    }),
  ).toBeNull();
  expect(hasActiveFactionMembership(memberships, "0xinactive")).toBe(false);
  expect(hasActiveFactionMembership(memberships, genericAddress)).toBe(true);
});

test("getFactionViewerPermissions derives founder, steward, and join states", () => {
  expect(getFactionViewerPermissions(memberships, genericAddress)).toMatchObject(
    {
      canJoin: false,
      canLeave: true,
      canManageMembers: false,
      canModerateQueues: true,
      isFounderAdmin: false,
      viewerMembershipActive: true,
      viewerRole: "steward",
    },
  );

  expect(
    getFactionViewerPermissions(
      [
        {
          address: canonicalAddress,
          role: "founder",
          isActive: true,
          joinedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      genericAddress,
    ),
  ).toMatchObject({
    canJoin: false,
    canLeave: false,
    canManageMembers: true,
    canModerateQueues: true,
    isFounderAdmin: true,
    viewerRole: "founder",
  });

  expect(getFactionViewerPermissions(memberships, "0xNew")).toMatchObject({
    canJoin: true,
    canLeave: false,
    canManageMembers: false,
    canModerateQueues: false,
    isFounderAdmin: false,
    viewerMembershipActive: false,
    viewerRole: null,
  });
});
