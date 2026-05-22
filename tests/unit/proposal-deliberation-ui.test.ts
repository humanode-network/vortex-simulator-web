import { expect, test } from "@rstest/core";

import {
  canAttemptProposalDiscussionWrite,
  filterProposalThreadsByCategory,
  getProposalThreadReplyCount,
  proposalThreadCategoryLabel,
  proposalThreadStatusLabel,
  restrictProposalThreadDetailForReadOnly,
  restrictProposalThreadListForReadOnly,
} from "../../src/lib/proposalDeliberationUi";
import type {
  ProposalThreadDetailDto,
  ProposalThreadDto,
  ProposalThreadListDto,
} from "../../src/types/api";

const baseThread: ProposalThreadDto = {
  id: "thread-1",
  proposalId: "proposal-1",
  decisionRootProposalId: "proposal-1",
  category: "question",
  status: "open",
  title: "How will this work?",
  body: "Please explain the mechanism.",
  authorAddress: "hmnAuthor",
  replies: 2,
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
  permissions: {
    canDelete: false,
    canReply: true,
    canTransition: true,
  },
};

function thread(overrides: Partial<ProposalThreadDto>): ProposalThreadDto {
  return {
    ...baseThread,
    ...overrides,
    permissions: {
      ...baseThread.permissions,
      ...overrides.permissions,
    },
  };
}

test("proposal deliberation labels category and status values", () => {
  expect(proposalThreadCategoryLabel("amendment")).toBe("Amendments");
  expect(proposalThreadCategoryLabel("general")).toBe("General");
  expect(proposalThreadStatusLabel("resolved")).toBe("Resolved");
  expect(proposalThreadStatusLabel("locked")).toBe("Locked");
  expect(proposalThreadStatusLabel("open")).toBe("Open");
});

test("proposal deliberation write access follows auth gate state", () => {
  expect(
    canAttemptProposalDiscussionWrite({
      enabled: false,
      authenticated: false,
      eligible: false,
    }),
  ).toBe(true);
  expect(
    canAttemptProposalDiscussionWrite({
      enabled: true,
      authenticated: true,
      eligible: true,
    }),
  ).toBe(true);
  expect(
    canAttemptProposalDiscussionWrite({
      enabled: true,
      authenticated: true,
      eligible: false,
    }),
  ).toBe(false);
});

test("proposal deliberation read-only projection removes write permissions", () => {
  const list: ProposalThreadListDto = {
    proposalId: "proposal-1",
    permissions: { canCreate: true },
    items: [baseThread],
  };
  const detail: ProposalThreadDetailDto = {
    proposalId: "proposal-1",
    thread: baseThread,
    messages: [],
  };

  expect(restrictProposalThreadListForReadOnly(list, true)).toBe(list);
  expect(restrictProposalThreadDetailForReadOnly(detail, true)).toBe(detail);
  expect(
    restrictProposalThreadListForReadOnly(list, false)?.permissions.canCreate,
  ).toBe(false);
  expect(
    restrictProposalThreadListForReadOnly(list, false)?.items[0].permissions,
  ).toMatchObject({ canReply: false, canTransition: false });
  expect(
    restrictProposalThreadDetailForReadOnly(detail, false)?.thread.permissions,
  ).toMatchObject({ canReply: false, canTransition: false });
});

test("proposal deliberation filters threads and counts replies", () => {
  const items = [
    thread({ id: "thread-1", category: "question", replies: 2 }),
    thread({ id: "thread-2", category: "support", replies: 3 }),
  ];
  expect(filterProposalThreadsByCategory(items, "all")).toEqual(items);
  expect(filterProposalThreadsByCategory(items, "support")).toEqual([items[1]]);
  expect(
    getProposalThreadReplyCount({
      proposalId: "proposal-1",
      permissions: { canCreate: true },
      items,
    }),
  ).toBe(5);
});
