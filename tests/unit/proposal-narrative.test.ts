import assert from "node:assert/strict";

import { test } from "@rstest/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProposalNarrative } from "../../src/components/ProposalNarrative";

test("legacy execution-plan arrays keep prose as prose", () => {
  const html = renderToStaticMarkup(
    createElement(ProposalNarrative, {
      value: [
        "Development will be managed through:",
        "Weekly public progress updates and testable release evidence.",
        "* Publish a public milestone update.",
        "* Keep source changes reviewable.",
      ],
    }),
  );

  assert.match(html, /<p[^>]*>Development will be managed through:<\/p>/);
  assert.match(
    html,
    /<p[^>]*>Weekly public progress updates and testable release evidence\.<\/p>/,
  );
  assert.match(html, /<ul[^>]*>/);
  assert.match(html, /<li>Publish a public milestone update\.<\/li>/);
  assert.match(html, /<li>Keep source changes reviewable\.<\/li>/);
  assert.doesNotMatch(html, /<li>Development will be managed through:/);
});

test("narrative reader preserves supported structure without author HTML", () => {
  const html = renderToStaticMarkup(
    createElement(ProposalNarrative, {
      value:
        "## Verification\n\nUse `vortex check`.\n\n> Publish the result.\n\n[Safe link](https://humanode.io) [Unsafe link](javascript:alert(1)) <b>not markup</b>",
    }),
  );

  assert.match(html, /<h3[^>]*>Verification<\/h3>/);
  assert.match(html, /<code[^>]*>vortex check<\/code>/);
  assert.match(html, /<blockquote[^>]*>Publish the result\.<\/blockquote>/);
  assert.match(html, /href="https:\/\/humanode\.io\/?"/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /&lt;b&gt;not markup&lt;\/b&gt;/);
});
