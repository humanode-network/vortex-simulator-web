import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

const chat = readFileSync(
  join(
    process.cwd(),
    "src/pages/initiatives/components/InitiativeChatSection.tsx",
  ),
  "utf8",
);
const initiative = readFileSync(
  join(process.cwd(), "src/pages/initiatives/Initiative.tsx"),
  "utf8",
);

test("Initiative chat is bounded, scroll-aware, and rendered last", () => {
  assert.match(chat, /h-\[clamp\(18rem,52vh,30rem\)\]/);
  assert.match(chat, /overflow-y-auto/);
  assert.match(chat, /overscroll-contain/);
  assert.match(chat, /messageViewportRef/);
  assert.match(chat, /stickToBottomRef/);
  assert.match(chat, /<Textarea/);
  assert.doesNotMatch(chat, /<Input/);
  assert.match(chat, /whitespace-pre-wrap/);
  assert.match(chat, /\[overflow-wrap:anywhere\]/);

  assert.ok(
    initiative.lastIndexOf("<InitiativeChatSection") >
      initiative.lastIndexOf("<InitiativeMembersSection"),
  );
  assert.ok(
    initiative.lastIndexOf("<InitiativeChatSection") >
      initiative.lastIndexOf("<InitiativeProposalsSection"),
  );
});
