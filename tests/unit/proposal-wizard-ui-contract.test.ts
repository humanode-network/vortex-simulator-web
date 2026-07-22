import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@rstest/core";

const root = process.cwd();

test("Proposal Wizard 2.0 owns submission and uses the shared glass shell", () => {
  const creation = readFileSync(
    join(root, "src/pages/proposals/ProposalCreation.tsx"),
    "utf8",
  );
  const shell = readFileSync(
    join(root, "src/pages/proposals/proposalCreation/ProposalWizardShell.tsx"),
    "utf8",
  );
  expect(creation).toContain("apiProposalSubmitToPool");
  expect(creation).toContain("<WizardProgress");
  expect(creation).toContain("<WizardWorkspace");
  expect(shell).toContain("<GlassyCard");
  expect(shell).not.toContain('from "@/components/primitives/card"');
});

test("Draft detail returns authors to the guided flow instead of submitting", () => {
  const detail = readFileSync(
    join(root, "src/pages/proposals/ProposalDraft.tsx"),
    "utf8",
  );
  expect(detail).toContain("Continue editing");
  expect(detail).toContain("apiProposalDraftDelete");
  expect(detail).toContain("Delete draft");
  expect(detail).not.toContain("apiProposalSubmitToPool");
  expect(detail).not.toContain("Submit to pool");
});

test("global proposal creation runtime is removed", () => {
  const creation = readFileSync(
    join(root, "src/pages/proposals/ProposalCreation.tsx"),
    "utf8",
  );
  const sessions = readFileSync(
    join(root, "src/pages/proposals/proposalCreation/sessionStorage.ts"),
    "utf8",
  );
  expect(creation).not.toContain("loadStep");
  expect(creation).not.toContain("STORAGE_STEP_KEY");
  expect(sessions).toContain("vortex:proposalWizard:sessions:v2");
  expect(sessions).toContain("migrateLegacy");
});

test("Review preserves the wizard's path-specific authoring sections", () => {
  const review = readFileSync(
    join(root, "src/pages/proposals/proposalCreation/steps/ReviewStep.tsx"),
    "utf8",
  );

  for (const section of [
    "Proposal path",
    "Identity",
    "Case",
    "Plan",
    "Funding and team",
    "System action",
    "Proposal identity",
    "Rationale",
    "Proposer",
    "Supporting material",
    "Confirm",
  ]) {
    expect(review).toContain(`title=\"${section}\"`);
  }
  expect(review).toContain("<ReviewLinks");
  expect(review).toContain("safeNarrativeHref");
  expect(review).toContain("<ProposalNarrative value={draft.what} />");
  expect(review).toContain("<ProposalNarrative value={draft.why} />");
  expect(review).toContain("<ProposalNarrative value={draft.how} />");
});
