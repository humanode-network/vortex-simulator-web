import { expect, test } from "@rstest/core";

import {
  canManageInitiative,
  defaultInitiativeBoardColumns,
  initiativeBoardCardCreatePath,
  initiativeCardsForColumn,
  initiativeDistinctDescription,
  initiativeOptionsWithSelection,
  initiativePath,
  parseInitiativeTags,
} from "../../src/lib/initiativeUi";
import type {
  InitiativeBoardCardDto,
  InitiativeBoardColumnDto,
} from "../../src/types/api";

const column: InitiativeBoardColumnDto = {
  id: "doing",
  key: "doing",
  title: "In progress",
  sortOrder: 1,
};

const card: InitiativeBoardCardDto = {
  id: "card-1",
  columnId: "doing",
  title: "Map contributor pathway",
  body: "",
  status: "doing",
  ownerAddress: null,
  sortOrder: 0,
  createdAt: "2026-06-29T10:00:00.000Z",
  updatedAt: "2026-06-29T10:00:00.000Z",
};

test("initiative board returns a card once when column id and key match", () => {
  expect(initiativeCardsForColumn([card], column)).toEqual([card]);
});

test("initiative board accepts status-key fallback for legacy card columns", () => {
  const legacyCard = { ...card, columnId: "" };
  expect(initiativeCardsForColumn([legacyCard], column)).toEqual([legacyCard]);
});

test("initiative board uses creation time as a stable sort-order tie break", () => {
  const laterCard = {
    ...card,
    id: "card-2",
    createdAt: "2026-06-29T11:00:00.000Z",
  };
  expect(initiativeCardsForColumn([laterCard, card], column)).toEqual([
    card,
    laterCard,
  ]);
});

test("initiative board exposes every default column before cards exist", () => {
  expect(defaultInitiativeBoardColumns.map((item) => item.key)).toEqual([
    "backlog",
    "doing",
    "proposal",
    "blocked",
    "done",
  ]);
});

test("initiative routes prefer encoded slugs and share the card-create path", () => {
  const initiative = { id: "initiative-1", slug: "Public work / review" };
  expect(initiativePath(initiative)).toBe(
    "/app/initiatives/Public%20work%20%2F%20review",
  );
  expect(initiativeBoardCardCreatePath(initiative)).toBe(
    "/app/initiatives/Public%20work%20%2F%20review/board/new",
  );
});

test("initiative management requires an active workspace and steward authority", () => {
  expect(
    canManageInitiative({ status: "active", viewerCanSteward: true }),
  ).toBe(true);
  expect(
    canManageInitiative({ status: "paused", viewerCanSteward: true }),
  ).toBe(false);
  expect(
    canManageInitiative({ status: "active", viewerCanSteward: false }),
  ).toBe(false);
});

test("proposal drafts retain an Initiative selection that is no longer available", () => {
  expect(
    initiativeOptionsWithSelection(
      [{ value: "initiative-1", label: "First" }],
      "initiative-2",
    ),
  ).toEqual([
    { value: "initiative-1", label: "First" },
    {
      value: "initiative-2",
      label: "Unavailable or no longer managed",
    },
  ]);
});

test("initiative tags are normalized and deduplicated", () => {
  expect(
    parseInitiativeTags("research, governance, research,  governance "),
  ).toEqual(["research", "governance"]);
});

test("initiative descriptions omit empty and summary-equivalent content", () => {
  expect(
    initiativeDistinctDescription(
      "Coordinate public work.",
      " Coordinate   public work. ",
    ),
  ).toBe("");
  expect(initiativeDistinctDescription("Coordinate public work.", "  ")).toBe(
    "",
  );
  expect(
    initiativeDistinctDescription(
      "Coordinate public work.",
      "Publish evidence and assign owners.",
    ),
  ).toBe("Publish evidence and assign owners.");
});
