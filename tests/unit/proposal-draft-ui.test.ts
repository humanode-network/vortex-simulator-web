import { describe, expect, test } from "@rstest/core";

import {
  canPublishDraft,
  editDraftRoute,
  isPublicDraftVisible,
  ownerDraftRoute,
  publicationRoute,
  publicDraftRoute,
  reconsiderProposalRoute,
} from "../../src/pages/proposals/draft/draftUi";

describe("proposal draft UI contracts", () => {
  test("builds encoded owner, editor, public, and reconsideration routes", () => {
    expect(ownerDraftRoute("draft / one")).toBe(
      "/app/proposals/drafts/draft%20%2F%20one",
    );
    expect(editDraftRoute("draft / one")).toBe(
      "/app/proposals/new?draftId=draft%20%2F%20one",
    );
    expect(publicDraftRoute("draft / one")).toBe(
      "/app/proposals/public-drafts/draft%20%2F%20one",
    );
    expect(reconsiderProposalRoute("proposal / one")).toBe(
      "/app/proposals/new?resubmitsProposalId=proposal%20%2F%20one",
    );
  });

  test("uses server routes and keeps publication states explicit", () => {
    expect(
      publicationRoute("draft-1", {
        status: "published",
        publicUrl: "/canonical/draft-1",
      }),
    ).toBe("/canonical/draft-1");
    expect(canPublishDraft({ status: "private" })).toBe(true);
    expect(
      canPublishDraft({
        status: "published",
        hasUnpublishedChanges: false,
      }),
    ).toBe(false);
    expect(isPublicDraftVisible({ status: "submitted" })).toBe(true);
    expect(isPublicDraftVisible({ status: "withdrawn" })).toBe(false);
  });
});
