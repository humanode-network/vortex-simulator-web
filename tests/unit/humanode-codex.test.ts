import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@rstest/core";

import {
  HUMANODE_CODEX_JURY_SIZE,
  HUMANODE_CODEX_SENTENCE_AUTHORIZATION,
  humanodeCodexClauses,
  humanodeCodexEvidenceRules,
  humanodeCodexExcludedMeasures,
  humanodeCodexHref,
  humanodeCodexMeasures,
  humanodeCodexMeasuresByCode,
  humanodeCodexOffenses,
  humanodeCodexOffensesByCode,
  humanodeCodexReference,
  humanodeCodexSeverityRules,
} from "../../src/data/humanodeCodex";

test("Humanode Codex covers every normalized offense with stable references", () => {
  assert.equal(humanodeCodexOffenses.length, 27);
  assert.equal(humanodeCodexOffensesByCode.size, 27);
  assert.equal(
    new Set(humanodeCodexOffenses.map((item) => item.ref)).size,
    humanodeCodexOffenses.length,
  );
  for (const offense of humanodeCodexOffenses) {
    assert.equal(offense.ref, `HC-3.${offense.code}`);
    assert.ok(offense.definition.length > 40);
    assert.ok(offense.allowedSeverities.length > 0);
    assert.ok(offense.allowedMeasures.length > 0);
    assert.ok(offense.allowedMeasures.includes(offense.minimumDisposition));
  }
});

test("every offense-to-measure link resolves to one Codex measure", () => {
  for (const offense of humanodeCodexOffenses) {
    const referenced = [
      ...offense.immediateMeasures,
      ...offense.corrections,
      ...offense.mandatoryMeasures,
      ...offense.requiredOneOf.flat(),
      ...offense.allowedMeasures,
    ];
    for (const code of referenced) {
      assert.ok(
        humanodeCodexMeasuresByCode.has(code),
        `${offense.code} references missing measure ${code}`,
      );
    }
  }
});

test("Codex references are unique and route to their exact clauses", () => {
  const refs = [
    ...humanodeCodexClauses.map((item) => item.ref),
    ...humanodeCodexOffenses.map((item) => item.ref),
    ...humanodeCodexMeasures.map((item) => item.ref),
    ...humanodeCodexExcludedMeasures.map((item) => item.ref),
    ...Object.values(humanodeCodexSeverityRules).map((item) => item.ref),
    ...Object.values(humanodeCodexEvidenceRules).map((item) => item.ref),
  ];
  assert.equal(new Set(refs).size, refs.length);
  for (const ref of refs) {
    assert.ok(
      humanodeCodexReference(ref),
      `Canonical Codex reference ${ref} must resolve to hint content`,
    );
  }
  for (const clause of humanodeCodexClauses) {
    clause.points.forEach((_, index) => {
      const ref = `${clause.ref}.${index + 1}`;
      assert.ok(
        humanodeCodexReference(ref),
        `Numbered Codex point ${ref} must resolve to hint content`,
      );
    });
  }
  assert.equal(
    humanodeCodexHref("GOV-03"),
    "/app/humanode-codex?clause=HC-3.GOV-03",
  );
  assert.equal(
    humanodeCodexReference("G-12")?.title,
    "Full governance restriction",
  );
  assert.equal(
    humanodeCodexReference("HC-2.4")?.title,
    "Court and decision rule",
  );
  assert.equal(humanodeCodexHref("L3"), "/app/humanode-codex?clause=HC-4.L3");
  assert.equal(humanodeCodexHref("E2"), "/app/humanode-codex?clause=HC-4.E2");
  assert.equal(
    humanodeCodexHref("court-codex-v1"),
    "/app/humanode-codex?clause=HC-1.1",
  );
  assert.equal(
    humanodeCodexReference("E3")?.title,
    "E3 - Verified critical fact plus clear attribution",
  );
  assert.equal(
    humanodeCodexReference("HC-2.2.1")?.description,
    humanodeCodexClauses.find((item) => item.ref === "HC-2.2")?.points[0],
  );
  assert.equal(
    humanodeCodexHref("HC-2.2.1"),
    "/app/humanode-codex?clause=HC-2.2.1",
  );
});

test("reserved measures cannot enter compiled offense sentence lists", () => {
  const reserved = new Set(
    humanodeCodexMeasures
      .filter((item) => item.status === "reserved")
      .map((item) => item.code),
  );
  assert.deepEqual([...reserved].sort(), ["E-02", "G-13"]);
  for (const offense of humanodeCodexOffenses) {
    assert.equal(
      offense.allowedMeasures.some((code) => reserved.has(code)),
      false,
      `${offense.code} must not enable a reserved measure`,
    );
  }
});

test("readable Codex offense levels and sentence measures match the server policy", () => {
  const serverRoot = resolve(process.cwd(), "../vortex-simulator-server");
  const contracts = readFileSync(
    resolve(serverRoot, "api/lib/courts/contracts.ts"),
    "utf8",
  );
  const corePolicy = readFileSync(
    resolve(serverRoot, "api/lib/courts/courtCodexV1.ts"),
    "utf8",
  );
  const sentencePolicy = readFileSync(
    resolve(serverRoot, "api/lib/courts/courtCodexV1SentencePolicy.ts"),
    "utf8",
  );
  const quotedValues = (source: string) =>
    [...source.matchAll(/"([A-Z0-9-]+)"/g)].map((match) => match[1]);

  assert.match(
    contracts,
    new RegExp(`COURT_JURY_SIZE = ${HUMANODE_CODEX_JURY_SIZE}\\b`),
  );
  assert.match(
    corePolicy,
    new RegExp(`authorization: ${HUMANODE_CODEX_SENTENCE_AUTHORIZATION}\\b`),
  );

  for (const offense of humanodeCodexOffenses) {
    const levels = corePolicy.match(
      new RegExp(`"${offense.code}": \\[([^\\]]+)\\]`),
    )?.[1];
    const measures = sentencePolicy.match(
      new RegExp(`"${offense.code}": template\\(\\s*\\[([^\\]]+)\\]`),
    )?.[1];
    assert.ok(levels, `Server severity policy is missing ${offense.code}`);
    assert.ok(measures, `Server sentence policy is missing ${offense.code}`);
    assert.deepEqual(quotedValues(levels), offense.allowedSeverities);
    assert.deepEqual(quotedValues(measures), offense.allowedMeasures);
  }
});
