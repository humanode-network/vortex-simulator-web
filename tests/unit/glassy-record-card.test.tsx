import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { GlassyRecordCard } from "../../src/components/GlassyRecordCard";

test("record cards retain the complete summary for expansion", () => {
  const finalSentence = "The complete final sentence remains available.";
  const summary = `${"Detailed proposal context. ".repeat(16)}${finalSentence}`;
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <GlassyRecordCard
        expanded
        onToggle={() => undefined}
        stage="pool"
        summary={summary}
        title="Long proposal"
      >
        <p>Proposal details</p>
      </GlassyRecordCard>
    </MemoryRouter>,
  );

  assert.match(html, /The complete final sentence remains available\./);
  assert.match(html, /glassy-record-card--open/);
});

test("record cards use visual ellipsis only while collapsed", () => {
  const css = readFileSync(
    join(process.cwd(), "src/components/GlassyRecordCard.css"),
    "utf8",
  );
  const collapsedRule = css.match(
    /\.glassy-record-card__summary\s*\{([^}]*)\}/,
  )?.[1];
  const expandedRule = css.match(
    /\.glassy-record-card--open \.glassy-record-card__summary\s*\{([^}]*)\}/,
  )?.[1];

  assert.ok(collapsedRule);
  assert.match(collapsedRule, /max-height:\s*1\.45em/);
  assert.match(collapsedRule, /text-overflow:\s*ellipsis/);
  assert.match(collapsedRule, /white-space:\s*nowrap/);

  assert.ok(expandedRule);
  assert.match(expandedRule, /max-height:\s*none/);
  assert.match(expandedRule, /overflow:\s*visible/);
  assert.match(expandedRule, /white-space:\s*normal/);

  assert.match(
    css,
    /\.glassy-record-card--open \.glassy-record-card__button\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  );
});
