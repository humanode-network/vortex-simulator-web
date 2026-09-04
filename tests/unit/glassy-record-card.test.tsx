import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { GlassyRecordCard } from "../../src/components/GlassyRecordCard";

test("glassy record cards retain the complete normalized summary", () => {
  const summary = [
    "Build and launch Ember, an independent Humanode-native chain explorer",
    "indexing both the Humanode chain and its governance history so every",
    "reader can inspect the complete public record without a shortened card.",
  ].join(" \n ");

  const html = renderToStaticMarkup(
    <MemoryRouter>
      <GlassyRecordCard
        expanded={false}
        onToggle={() => undefined}
        stage="pool"
        summary={summary}
        title="Ember - a native Humanode Explorer"
      >
        <p>Proposal details</p>
      </GlassyRecordCard>
    </MemoryRouter>,
  );

  assert.match(
    html,
    /indexing both the Humanode chain and its governance history/,
  );
  assert.match(html, /without a shortened card\./);
  assert.doesNotMatch(html, /\s{2,}/);
});

test("glassy record cards reserve a stable scrollable summary region", () => {
  const css = readFileSync(
    join(process.cwd(), "src/components/GlassyRecordCard.css"),
    "utf8",
  );
  const summaryRule = css.match(
    /\.glassy-record-card__summary\s*\{([^}]*)\}/,
  )?.[1];

  assert.ok(summaryRule);
  assert.match(summaryRule, /height:\s*4\.35em/);
  assert.match(summaryRule, /overflow-y:\s*auto/);
  assert.match(summaryRule, /grid-area:\s*summary/);
  assert.doesNotMatch(summaryRule, /max-height:\s*1\.45em/);
  assert.doesNotMatch(summaryRule, /overflow:\s*hidden/);

  const buttonRule = css.match(
    /\.glassy-record-card__button\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(buttonRule);
  assert.match(buttonRule, /"summary summary"/);
  assert.match(buttonRule, /"association association"/);

  const titleRule = css.match(
    /\.glassy-record-card__titleRow\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(titleRule);
  assert.match(titleRule, /height:\s*5\.4rem/);
  assert.match(titleRule, /overflow-y:\s*auto/);
});
