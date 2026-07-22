import type React from "react";

import { AddressInline } from "@/components/AddressInline";
import {
  ProposalNarrative,
  safeNarrativeHref,
} from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import { Label } from "@/components/primitives/label";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { formatProposalType } from "@/lib/proposalTypes";
import type { ChamberDto } from "@/types/api";

import { newId } from "../ids";
import { EditableLinkList } from "../EditableLinkList";
import { getSystemActionMeta } from "../templates/systemActions";
import type { LinkItem, ProposalDraftForm } from "../types";
import { WizardFieldSection } from "../WizardFieldSection";

function ReviewFact({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="proposal-wizard__review-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function hasLinkContent(link: LinkItem) {
  return link.label.trim().length > 0 || link.url.trim().length > 0;
}

function ReviewLinks({
  emptyLabel,
  links,
}: {
  emptyLabel: string;
  links: LinkItem[];
}) {
  const visibleLinks = links.filter(hasLinkContent);
  if (visibleLinks.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="proposal-wizard__review-list">
      {visibleLinks.map((link) => {
        const href = safeNarrativeHref(link.url);
        const label = link.label.trim() || link.url.trim() || "Untitled link";
        return (
          <li key={link.id} className="proposal-wizard__review-item">
            {href ? (
              <a href={href} rel="noreferrer" target="_blank">
                {label}
              </a>
            ) : (
              <span>{label}</span>
            )}
            {link.url.trim().length > 0 ? <small>{link.url}</small> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ReviewStep(props: {
  budgetTotal: number;
  canAct: boolean;
  canSubmit: boolean;
  draft: ProposalDraftForm;
  formationEligible?: boolean;
  mode: "project" | "system";
  presetLabel?: string;
  proposerAddress: string | null;
  selectedChamber: ChamberDto | null;
  selectedInitiative?: { id: string; title: string } | null;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  textareaClassName: string;
}) {
  const {
    budgetTotal,
    canAct,
    canSubmit,
    draft,
    formationEligible,
    mode,
    presetLabel,
    proposerAddress,
    selectedChamber,
    selectedInitiative,
    setDraft,
    textareaClassName,
  } = props;
  const hasFormation = formationEligible !== false;
  const systemActionMeta = draft.metaGovernance?.action
    ? getSystemActionMeta(draft.metaGovernance.action)
    : null;
  const executionLabel =
    mode === "system"
      ? "System change"
      : hasFormation
        ? "Formation project"
        : "Policy";

  return (
    <div className="space-y-6">
      <WizardFieldSection
        title="Proposal path"
        description="The governing path selected at the start of this draft."
      >
        <dl className="proposal-wizard__review-facts">
          <ReviewFact label="Kind">
            {mode === "system" ? "System change" : "Project proposal"}
          </ReviewFact>
          <ReviewFact label="Execution">{executionLabel}</ReviewFact>
          <ReviewFact label="Proposal type">
            {formatProposalType(draft.proposalType)}
          </ReviewFact>
          <ReviewFact label="Preset">
            {presetLabel ?? draft.presetId ?? "Not selected"}
          </ReviewFact>
        </dl>
      </WizardFieldSection>

      {mode === "system" ? (
        <>
          <WizardFieldSection
            title="System action"
            description="The canonical target and values that this change will apply."
          >
            <dl className="proposal-wizard__review-facts">
              <ReviewFact label="Action">
                {systemActionMeta?.label ?? "Not selected"}
              </ReviewFact>
              <ReviewFact label="Chamber">General chamber</ReviewFact>
              {systemActionMeta?.requiresChamberId ? (
                <ReviewFact label="Target chamber id">
                  {draft.metaGovernance?.chamberId ?? "Not set"}
                </ReviewFact>
              ) : null}
              {systemActionMeta?.requiresTargetAddress ? (
                <ReviewFact label="Target governor">
                  {draft.metaGovernance?.targetAddress ?? "Not set"}
                </ReviewFact>
              ) : null}
              {systemActionMeta?.requiresTitle ? (
                <ReviewFact label="New title">
                  {draft.metaGovernance?.title ?? "Not set"}
                </ReviewFact>
              ) : null}
              {systemActionMeta?.showMultiplier ? (
                <ReviewFact label="Multiplier">
                  {draft.metaGovernance?.multiplier ?? "Not set"}
                </ReviewFact>
              ) : null}
            </dl>
            {systemActionMeta?.showGenesisMembers ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text">
                  Genesis members
                </p>
                {(draft.metaGovernance?.genesisMembers ?? []).length > 0 ? (
                  <ul className="proposal-wizard__review-list">
                    {draft.metaGovernance?.genesisMembers?.map((address) => (
                      <li
                        key={address}
                        className="proposal-wizard__review-item"
                      >
                        <AddressInline address={address} size={10} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No genesis members set.</p>
                )}
              </div>
            ) : null}
          </WizardFieldSection>

          <WizardFieldSection
            title="Proposal identity"
            description="The public title and context shown to governors."
          >
            <div className="proposal-wizard__review-title">
              <h3>{draft.title || "Untitled proposal"}</h3>
              {draft.summary.trim().length > 0 ? <p>{draft.summary}</p> : null}
            </div>
            <dl className="proposal-wizard__review-facts">
              <ReviewFact label="Initiative">
                {selectedInitiative?.title ?? "None"}
              </ReviewFact>
            </dl>
          </WizardFieldSection>

          <WizardFieldSection
            title="Rationale"
            description="How the system change should be applied and verified."
          >
            <ProposalNarrative value={draft.how} />
          </WizardFieldSection>
        </>
      ) : (
        <>
          <WizardFieldSection
            title="Identity"
            description="The proposal name and governing context."
          >
            <div className="proposal-wizard__review-title">
              <h3>{draft.title || "Untitled proposal"}</h3>
              {draft.summary.trim().length > 0 ? <p>{draft.summary}</p> : null}
            </div>
            <dl className="proposal-wizard__review-facts">
              <ReviewFact label="Chamber">
                {(selectedChamber?.name ?? draft.chamberId) || "Not selected"}
              </ReviewFact>
              <ReviewFact label="Initiative">
                {selectedInitiative?.title ?? "None"}
              </ReviewFact>
            </dl>
          </WizardFieldSection>

          <WizardFieldSection
            title="Case"
            description="The change being proposed and the reason for it."
          >
            <div className="proposal-wizard__review-narratives">
              <div>
                <h3>What</h3>
                <ProposalNarrative value={draft.what} />
              </div>
              <div>
                <h3>Why</h3>
                <ProposalNarrative value={draft.why} />
              </div>
            </div>
          </WizardFieldSection>

          <WizardFieldSection
            title="Plan"
            description="The intended execution and where its public outcomes will live."
          >
            <div className="space-y-4">
              <div>
                <h3 className="proposal-wizard__review-subheading">How</h3>
                <ProposalNarrative value={draft.how} />
              </div>
              {hasFormation ? (
                <div>
                  <h3 className="proposal-wizard__review-subheading">When</h3>
                  {draft.timeline.length === 0 ? (
                    <p className="text-sm text-muted">No milestones added.</p>
                  ) : (
                    <ul className="proposal-wizard__review-list">
                      {draft.timeline.map((milestone, index) => (
                        <li
                          key={milestone.id}
                          className="proposal-wizard__review-item"
                        >
                          <strong>
                            {milestone.title.trim() || `Milestone ${index + 1}`}
                          </strong>
                          <small>
                            {milestone.timeframe.trim() ||
                              "Timeframe not specified"}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              <div>
                <h3 className="proposal-wizard__review-subheading">Where</h3>
                <ReviewLinks
                  emptyLabel="No public outcome links added."
                  links={draft.outputs}
                />
              </div>
            </div>
          </WizardFieldSection>

          {hasFormation ? (
            <WizardFieldSection
              title="Funding and team"
              description="Milestone funding and the Formation roles still needed."
            >
              <dl className="proposal-wizard__review-facts">
                <ReviewFact label="Total budget">
                  {budgetTotal.toLocaleString()} HMND
                </ReviewFact>
                <ReviewFact label="Team slots">
                  1 / {1 + draft.openSlotNeeds.length}
                </ReviewFact>
              </dl>
              <div className="space-y-2">
                <h3 className="proposal-wizard__review-subheading">
                  Milestone funding
                </h3>
                <ul className="proposal-wizard__review-list">
                  {draft.timeline.map((milestone, index) => (
                    <li
                      key={milestone.id}
                      className="proposal-wizard__review-item"
                    >
                      <strong>
                        {milestone.title.trim() || `Milestone ${index + 1}`}
                      </strong>
                      <small>
                        {Number(milestone.budgetHmnd) > 0
                          ? `${Number(milestone.budgetHmnd).toLocaleString()} HMND`
                          : "No budget set"}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="proposal-wizard__review-subheading">
                  Team needs
                </h3>
                {draft.openSlotNeeds.length === 0 ? (
                  <p className="text-sm text-muted">No open roles defined.</p>
                ) : (
                  <ul className="proposal-wizard__review-list">
                    {draft.openSlotNeeds.map((slot) => (
                      <li
                        key={slot.id}
                        className="proposal-wizard__review-item"
                      >
                        <strong>{slot.title.trim() || "Untitled role"}</strong>
                        {slot.desc.trim() ? <small>{slot.desc}</small> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </WizardFieldSection>
          ) : null}
        </>
      )}

      <WizardFieldSection
        title="Proposer"
        description="The wallet submitting this proposal and any optional context."
      >
        <dl className="proposal-wizard__review-facts">
          <ReviewFact label="Wallet">
            {proposerAddress ? (
              <AddressInline address={proposerAddress} size={7} />
            ) : (
              "Not connected"
            )}
          </ReviewFact>
        </dl>
        <div className="space-y-2">
          <Label htmlFor="about">Tell about yourself (optional)</Label>
          <textarea
            id="about"
            rows={3}
            className={textareaClassName}
            value={draft.aboutMe}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                aboutMe: event.target.value,
              }))
            }
            placeholder="Short intro / credentials / relevant experience."
          />
        </div>
      </WizardFieldSection>

      <WizardFieldSection
        title="Supporting material"
        description="Links to evidence, designs, specifications, or supporting documents."
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted">Attachments are optional.</p>
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() =>
              setDraft((previous) => ({
                ...previous,
                attachments: [
                  ...previous.attachments,
                  { id: newId("att"), label: "", url: "" },
                ],
              }))
            }
          >
            Add link
          </Button>
        </div>
        <EditableLinkList
          emptyMessage="No supporting material added."
          items={draft.attachments}
          labelPlaceholder="Label"
          urlPlaceholder="https://..."
          onChange={(id, field, value) =>
            setDraft((previous) => ({
              ...previous,
              attachments: previous.attachments.map((item) =>
                item.id === id ? { ...item, [field]: value } : item,
              ),
            }))
          }
          onRemove={(id) =>
            setDraft((previous) => ({
              ...previous,
              attachments: previous.attachments.filter(
                (item) => item.id !== id,
              ),
            }))
          }
        />
      </WizardFieldSection>

      <WizardFieldSection
        title="Confirm"
        description="Confirm that the proposal is accurate and ready for submission."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text">
            <input
              id="agree-rules"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={draft.agreeRules}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  agreeRules: event.target.checked,
                }))
              }
            />
            I agree to the rules
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text">
            <input
              id="confirm-budget"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={draft.confirmBudget}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  confirmBudget: event.target.checked,
                }))
              }
            />
            {mode === "project" && hasFormation
              ? "I confirm the budget is accurate"
              : "I confirm the proposal details are accurate"}
          </label>
        </div>
        {!canSubmit ? (
          <p className="text-xs text-muted">
            Submit unlocks after the required fields and both confirmations are
            complete.
          </p>
        ) : null}
        {SIM_AUTH_ENABLED && !canAct ? (
          <p className="text-xs text-muted">
            Submitting is available only to eligible human nodes.
          </p>
        ) : null}
      </WizardFieldSection>
    </div>
  );
}
