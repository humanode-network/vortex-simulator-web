import { expect, test } from "@rstest/core";
import { loadUrgentFeed } from "../../src/lib/feedUrgent";
import type {
  FeedItemDto,
  GovernorOpportunityAccountingDto,
} from "../../src/types/api";

const viewer = "feed-pagination-viewer";
const input = {
  address: viewer,
  chambers: ["general"],
  limit: 6,
  isGovernorActive: false,
  governorOpportunities: null,
};

function event(index: number): FeedItemDto {
  return {
    id: `review-${index}`,
    title: `Project ${index}`,
    summary: "Review this project.",
    summaryPill: "Formation",
    meta: "Formation",
    stage: "build",
    actionable: true,
    proposerId: viewer,
    href: `/app/proposals/project-${index}/formation`,
    timestamp: new Date(Date.UTC(2026, 9, 2, 0, index)).toISOString(),
  };
}

async function withApi(
  respond: (url: URL) => unknown,
  run: (requests: URL[]) => Promise<void>,
) {
  const original = globalThis.fetch;
  const requests: URL[] = [];
  globalThis.fetch = async (request) => {
    const url = new URL(String(request), "https://pagination.test");
    requests.push(url);
    return new Response(JSON.stringify(respond(url)), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    await run(requests);
  } finally {
    globalThis.fetch = original;
  }
}

test("urgent pagination reveals buffered records without duplicate network requests", async () => {
  const items = Array.from({ length: 20 }, (_, index) => event(index));
  await withApi(
    (url) => ({
      items: url.searchParams.get("stage") === "build" ? items : [],
    }),
    async (requests) => {
      let page = await loadUrgentFeed(input);
      expect(page.items).toHaveLength(6);
      expect(page.hasMore).toBe(true);
      for (const limit of [12, 18, 24]) {
        page = await loadUrgentFeed({
          ...input,
          limit,
          continuation: page.continuation!,
        });
        expect(page.items).toHaveLength(Math.min(limit, 20));
      }
      expect(requests).toHaveLength(5);
      expect(page.hasMore).toBe(false);
      expect(page.continuation).toBe(null);
      expect(new Set(page.items.map((item) => item.id)).size).toBe(20);
    },
  );
});

test("urgent continuation retains each stream's original scope and cursor", async () => {
  await withApi(
    (url) => {
      if (!url.searchParams.has("stage"))
        return {
          items: url.searchParams.has("cursor")
            ? [event(1), event(2)]
            : [{ ...event(0), actionable: false }],
          nextCursor: url.searchParams.has("cursor")
            ? null
            : "next-general-page",
        };
      return { items: [] };
    },
    async (requests) => {
      const initial = await loadUrgentFeed(input);
      expect(initial.items).toHaveLength(0);
      expect(initial.hasMore).toBe(true);
      const next = await loadUrgentFeed({
        ...input,
        limit: 12,
        continuation: initial.continuation!,
      });
      expect(next.items).toHaveLength(2);
      expect(next.hasMore).toBe(false);
      const request = requests.find((url) => url.searchParams.has("cursor"))!;
      expect(request.searchParams.get("cursor")).toBe("next-general-page");
      expect(request.searchParams.get("chambers")).toBe("general");
      expect(request.searchParams.get("excludeStages")).toBe("system");
    },
  );
});

function accounting(offset: number): GovernorOpportunityAccountingDto {
  return {
    exposureSeconds: 86400,
    activeGovernorReason: "missed_pool_requirement",
    pool: { raw: 4, accountable: 4, completed: 0, required: 4 },
    chamber: { raw: 0, accountable: 0, completed: 0, required: 0 },
    items: [offset, offset + 1].map((index) => ({
      occurrenceId: `policy-${index}:pool`,
      proposalId: `policy-${index}`,
      proposalTitle: `Policy ${index}`,
      chamberId: "general",
      chamberTitle: "General",
      proposalStage: "pool",
      stage: "pool",
      state: "available",
      accountable: true,
      canBecomeAccountable: true,
      participated: false,
      openedAt: new Date(Date.UTC(2026, 9, 2, 0, index)).toISOString(),
      accountableAt: "2026-10-03T00:00:00.000Z",
      closedAt: null,
      exclusionReason: null,
    })),
    page: { offset, limit: 2, total: 4, stage: null, state: "available" },
  };
}

test("urgent continuation includes later verified opportunities for inactive governors", async () => {
  await withApi(
    (url) =>
      url.pathname === "/api/my-governance"
        ? {
            opportunityAccounting: accounting(
              Number(url.searchParams.get("opportunityOffset")),
            ),
          }
        : { items: [] },
    async (requests) => {
      const initial = await loadUrgentFeed({
        ...input,
        governorOpportunities: accounting(0),
      });
      expect(initial.items).toHaveLength(2);
      const next = await loadUrgentFeed({
        ...input,
        limit: 12,
        governorOpportunities: accounting(0),
        continuation: initial.continuation!,
      });
      expect(next.items).toHaveLength(4);
      expect(next.hasMore).toBe(false);
      const request = requests.find(
        (url) => url.pathname === "/api/my-governance",
      )!;
      expect(request.searchParams.get("opportunityOffset")).toBe("2");
      expect(request.searchParams.get("opportunityState")).toBe("available");
    },
  );
});

test("an exact full urgent page does not advertise nonexistent records", async () => {
  await withApi(
    (url) => ({
      items:
        url.searchParams.get("stage") === "build"
          ? Array.from({ length: 6 }, (_, i) => event(i))
          : [],
    }),
    async () => {
      const page = await loadUrgentFeed(input);
      expect(page.items).toHaveLength(6);
      expect(page.hasMore).toBe(false);
    },
  );
});

test("a stalled source cursor fails explicitly without mutating retry state", async () => {
  await withApi(
    (url) => ({
      items: [],
      nextCursor:
        url.searchParams.get("stage") === "faction" ? "stalled" : null,
    }),
    async () => {
      const page = await loadUrgentFeed(input);
      await expect(
        loadUrgentFeed({
          ...input,
          limit: 12,
          continuation: page.continuation!,
        }),
      ).rejects.toThrow("could not advance");
      const streams = page.continuation!.streams;
      expect(streams[streams.length - 1].cursor).toBe("stalled");
    },
  );
});
