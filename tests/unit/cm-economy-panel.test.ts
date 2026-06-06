import assert from "node:assert/strict";
import { test } from "@rstest/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CmEconomyPanel } from "../../src/components/CmEconomyPanel";

test("CmEconomyPanel renders CM totals, chamber breakdown, and history", () => {
  const html = renderToStaticMarkup(
    createElement(CmEconomyPanel, {
      totals: { lcm: 12, mcm: 8, acm: 20 },
      chambers: [
        {
          chamberId: "alpha",
          chamberTitle: "Alpha Chamber",
          multiplier: 1.2,
          lcm: 5,
          mcm: 3,
          acm: 6,
        },
      ],
      history: [
        {
          proposalId: "proposal-alpha",
          title: "Alpha Proposal",
          chamberId: "alpha",
          avgScore: 7,
          lcm: 4,
          mcm: 2,
          multiplier: 1.2,
          awardedAt: new Date().toISOString(),
        },
      ],
    }),
  );

  assert.ok(html.includes("CM + MM"));
  assert.ok(html.includes("Alpha Chamber"));
  assert.ok(html.includes("LCM"));
  assert.ok(html.includes("5"));
  assert.ok(html.includes("Members"));
  assert.ok(html.includes("Alpha Proposal"));
  assert.ok(html.includes("MM"));
  assert.ok(html.includes("glassy-compact-row"));
});

test("CmEconomyPanel personal scope shows ACM and MM without chamber CM totals", () => {
  const html = renderToStaticMarkup(
    createElement(CmEconomyPanel, {
      totals: { lcm: 12, mcm: 8, acm: 20 },
      chambers: [],
      history: [],
      mmValue: 20,
      totalsScope: "personal",
    }),
  );

  assert.ok(html.includes("CM + MM"));
  assert.ok(html.includes("ACM"));
  assert.ok(html.includes("MM"));
  assert.equal(html.includes("MCM"), false);
  assert.equal(html.includes("LCM"), false);
});
