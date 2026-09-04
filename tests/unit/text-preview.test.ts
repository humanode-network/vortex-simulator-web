import { test } from "@rstest/core";
import assert from "node:assert/strict";

import {
  normalizePreviewText,
  PROPOSAL_SUMMARY_PREVIEW_MAX,
  proposalSummaryPreview,
} from "../../src/lib/textPreview.ts";

test("normalizes preview text without shortening it", () => {
  const summary = `A complete summary ${"with substantial detail ".repeat(20)}`;

  const normalized = normalizePreviewText(`  ${summary}\n\n`);

  assert.equal(normalized, summary.trim());
  assert.ok(normalized.length > PROPOSAL_SUMMARY_PREVIEW_MAX);
});

test("proposal summary preview caps text without adding ellipsis", () => {
  const summary = [
    "This proposal coordinates a long operational sequence across chambers,",
    "formation teams, milestone delivery, budget routing, and public review so",
    "that the card preview has to apply a stable text budget before rendering.",
  ].join(" ");

  const preview = proposalSummaryPreview(summary, 120);

  assert.ok(preview.length <= 120);
  assert.equal(preview.includes("..."), false);
  assert.equal(preview.endsWith("."), false);
});

test("proposal summary preview normalizes whitespace", () => {
  assert.equal(
    proposalSummaryPreview("  One\n\nproposal\t summary.  "),
    "One proposal summary.",
  );
});
