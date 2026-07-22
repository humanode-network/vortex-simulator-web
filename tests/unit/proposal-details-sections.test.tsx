import { expect, test } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { ProposalDetailsSections } from "../../src/pages/proposals/shared/ProposalDetailsSections";
import type { ProposalAuthoringDetailsDto } from "../../src/types/api";

const projectAuthoring: ProposalAuthoringDetailsDto = {
  kind: "project",
  presetId: "public-goods",
  proposalType: "core",
  what: "Create a public evidence register.",
  why: "Governors need auditable sources.",
  how: "Define a source standard and publish the register.",
  aboutMe: "I maintain public research archives.",
  outputs: [
    {
      id: "register",
      label: "Public source register",
      href: "https://example.com/register",
    },
  ],
  timeline: [
    {
      title: "Evidence standard",
      timeframe: "Weeks 1-2",
      budgetHmnd: "4000",
    },
  ],
  budgetItems: [{ description: "Evidence standard", amountHmnd: "4000" }],
  systemAction: null,
};

test("proposal details render every project authoring field once", () => {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <ProposalDetailsSections
        attachments={[
          {
            id: "brief",
            title: "Research brief",
            href: "https://example.com/brief",
          },
        ]}
        authoring={projectAuthoring}
        budgetScope="Evidence standard: 4000 HMND"
        executionPlan={["Define a source standard and publish the register."]}
        overview="Create a public evidence register."
        stats={[]}
        summary="A fully specified project proposal."
      />
    </MemoryRouter>,
  );

  for (const value of [
    "Proposal path",
    "Create a public evidence register.",
    "Governors need auditable sources.",
    "Define a source standard and publish the register.",
    "Public source register",
    "Evidence standard",
    "Weeks 1-2",
    "4000 HMND",
    "I maintain public research archives.",
    "Research brief",
  ]) {
    expect(markup).toContain(value);
  }
});

test("proposal details render the structured system action instead of hiding it", () => {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <ProposalDetailsSections
        attachments={[]}
        authoring={{
          ...projectAuthoring,
          kind: "system",
          systemAction: {
            action: "chamber.create",
            chamberId: "research",
            targetAddress: null,
            title: "Research Chamber",
            multiplier: "1.5",
            genesisMembers: [
              "hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W",
            ],
          },
        }}
        budgetScope=""
        executionPlan={[]}
        overview=""
        stats={[]}
        summary="Create a research chamber."
      />
    </MemoryRouter>,
  );

  for (const value of [
    "System action",
    "Create chamber",
    "research",
    "Research Chamber",
    "1.5",
    "Genesis members",
    "hmr1",
  ]) {
    expect(markup).toContain(value);
  }
});

test("proposal details retain the legacy view when structured authoring is empty", () => {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <ProposalDetailsSections
        attachments={[]}
        authoring={{
          ...projectAuthoring,
          what: "",
          why: "",
          how: "",
          aboutMe: "",
          outputs: [],
          timeline: [],
          budgetItems: [],
        }}
        budgetScope="No Formation budget"
        executionPlan={["Publish the existing policy."]}
        overview="Existing historical proposal overview."
        stats={[]}
        summary="Historical proposal."
      />
    </MemoryRouter>,
  );

  expect(markup).toContain("Proposal overview");
  expect(markup).toContain("Existing historical proposal overview.");
  expect(markup).not.toContain("Proposal path");
});
