import { test } from "@rstest/core";
import assert from "node:assert/strict";

import {
  getFormationActionVisibility,
  type FormationActionVisibilityInput,
} from "../../src/lib/formationActionsUi.ts";

const baseInput: FormationActionVisibilityInput = {
  actionBusy: false,
  authenticated: true,
  eligible: true,
  hasOpenRoles: true,
  isProposerViewer: false,
  nextMilestone: 2,
  pendingMilestone: undefined,
  projectState: "active",
  viewerIsTeamMember: false,
};

test("formation actions show join only to non-member non-proposer with open roles", () => {
  const visibility = getFormationActionVisibility(baseInput);

  assert.equal(visibility.showJoinProject, true);
  assert.equal(visibility.canJoinProject, true);
  assert.equal(visibility.showSubmitMilestone, false);
  assert.equal(visibility.showFinishProject, false);
});

test("formation actions hide join from team members", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    viewerIsTeamMember: true,
  });

  assert.equal(visibility.showJoinProject, false);
  assert.equal(
    visibility.statusMessage,
    "You are on this Formation team. No team action is available right now.",
  );
});

test("formation actions show milestone submit only to proposer", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    isProposerViewer: true,
    viewerIsTeamMember: true,
  });

  assert.equal(visibility.showJoinProject, false);
  assert.equal(visibility.showSubmitMilestone, true);
  assert.equal(visibility.canSubmitMilestone, true);
});

test("formation actions show chamber vote navigation when milestone vote is pending", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    hasOpenRoles: false,
    pendingMilestone: 2,
    projectState: "awaiting_milestone_vote",
  });

  assert.equal(visibility.showOpenMilestoneVote, true);
  assert.equal(visibility.canOpenMilestoneVote, true);
  assert.equal(visibility.showJoinProject, false);
});

test("formation actions hide chamber vote navigation from project team members", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    hasOpenRoles: false,
    pendingMilestone: 2,
    projectState: "awaiting_milestone_vote",
    viewerIsTeamMember: true,
  });

  assert.equal(visibility.showOpenMilestoneVote, false);
});

test("formation actions can disable chamber vote navigation from server eligibility", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    hasOpenRoles: false,
    pendingMilestone: 2,
    projectState: "awaiting_milestone_vote",
    viewerCanOpenMilestoneVote: false,
  });

  assert.equal(visibility.showOpenMilestoneVote, true);
  assert.equal(visibility.canOpenMilestoneVote, false);
});

test("formation actions show finish only to proposer when ready", () => {
  const visibility = getFormationActionVisibility({
    ...baseInput,
    hasOpenRoles: false,
    isProposerViewer: true,
    projectState: "ready_to_finish",
    viewerIsTeamMember: true,
  });

  assert.equal(visibility.showFinishProject, true);
  assert.equal(visibility.canFinishProject, true);
  assert.equal(visibility.showJoinProject, false);
});
