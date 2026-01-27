import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import { Button } from "@/components/primitives/button";
import { TierLabel } from "@/components/TierLabel";
import type { ProposalDraftForm } from "../types";
import { apiActiveHumans } from "@/lib/apiClient";
import {
  SYSTEM_ACTIONS,
  getSystemActionMeta,
  type SystemActionId,
} from "../templates/systemActions";

type MetaGovernanceDraft = NonNullable<ProposalDraftForm["metaGovernance"]>;

const PROPOSAL_TYPE_OPTIONS: Array<{
  value: ProposalDraftForm["proposalType"];
  label: string;
  helper: string;
}> = [
  {
    value: "basic",
    label: "Basic",
    helper: "Routine proposals that do not change core system parameters.",
  },
  {
    value: "fee",
    label: "Fee distribution",
    helper: "Adjust fee/treasury allocation rules.",
  },
  {
    value: "monetary",
    label: "Monetary system",
    helper: "Token issuance, emission, or monetary policy changes.",
  },
  {
    value: "core",
    label: "Core infrastructure",
    helper: "Protocol and infrastructure-level changes.",
  },
  {
    value: "administrative",
    label: "Administrative",
    helper: "Governance operations (e.g., chamber lifecycle).",
  },
  {
    value: "dao-core",
    label: "DAO core",
    helper: "Changes to the governance protocol itself.",
  },
];

export function EssentialsStep(props: {
  attemptedNext: boolean;
  chamberOptions: { value: string; label: string }[];
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  templateId: "project" | "system";
  setTemplateId: (templateId: "project" | "system") => void;
  textareaClassName: string;
  requiredTier: string;
  currentTier: string | null;
  tierEligible: boolean;
}) {
  const {
    attemptedNext,
    chamberOptions,
    draft,
    setDraft,
    templateId,
    setTemplateId,
    textareaClassName,
    requiredTier,
    currentTier,
    tierEligible,
  } = props;

  const isSystemProposal = templateId === "system";
  const hasGeneralOption = chamberOptions.some(
    (opt) => opt.value === "general",
  );
  const systemChamberOptions = chamberOptions.filter(
    (opt) => opt.value !== "general",
  );
  const systemAction = draft.metaGovernance?.action as
    | SystemActionId
    | undefined;
  const systemActionMeta = getSystemActionMeta(systemAction);
  const allowSystemChamberSelect =
    isSystemProposal && systemAction === "chamber.dissolve";
  const [activeHumanOptions, setActiveHumanOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [activeHumanError, setActiveHumanError] = useState<string | null>(null);
  const [selectedGenesisMember, setSelectedGenesisMember] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!systemActionMeta.showGenesisMembers) {
      return () => {
        cancelled = true;
      };
    }
    apiActiveHumans()
      .then((res) => {
        if (cancelled) return;
        setActiveHumanError(null);
        const items = res.items
          .map((item) => item.address)
          .filter(Boolean)
          .map((address) => ({ value: address, label: address }));
        setActiveHumanOptions(items);
      })
      .catch((error) => {
        if (cancelled) return;
        setActiveHumanError((error as Error).message);
        setActiveHumanOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [systemActionMeta.showGenesisMembers]);

  const availableGenesisOptions = useMemo(() => {
    const selected = new Set(draft.metaGovernance?.genesisMembers ?? []);
    return activeHumanOptions.filter((opt) => !selected.has(opt.value));
  }, [activeHumanOptions, draft.metaGovernance?.genesisMembers]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="proposal-kind">Kind</Label>
        <Select
          id="proposal-kind"
          value={templateId}
          onChange={(e) => {
            const next = e.target.value as "project" | "system";
            setTemplateId(next);
            setDraft((prev) => {
              if (next === "system") {
                const nextMeta: MetaGovernanceDraft = {
                  action: "chamber.create",
                  chamberId: "",
                  title: "",
                  multiplier: undefined,
                  genesisMembers: [],
                };
                return {
                  ...prev,
                  chamberId: "general",
                  proposalType: "administrative",
                  metaGovernance: nextMeta,
                };
              }
              return {
                ...prev,
                proposalType:
                  prev.proposalType === "administrative"
                    ? "basic"
                    : (prev.proposalType ?? "basic"),
                metaGovernance: undefined,
              };
            });
          }}
        >
          <option value="project">Project proposal</option>
          <option value="system">System change (General)</option>
        </Select>
        <p className="text-xs text-muted">
          System changes affect simulation variables directly (e.g., chamber
          creation). Project proposals describe work outside the system.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="proposal-type">Proposal type</Label>
        <Select
          id="proposal-type"
          value={isSystemProposal ? "administrative" : draft.proposalType}
          disabled={isSystemProposal}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              proposalType: e.target.value as ProposalDraftForm["proposalType"],
            }))
          }
        >
          {PROPOSAL_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted">
          {isSystemProposal
            ? "System proposals are administrative by definition."
            : PROPOSAL_TYPE_OPTIONS.find(
                (option) => option.value === draft.proposalType,
              )?.helper}
          <span className="mt-1 block">
            Required tier: <TierLabel tier={requiredTier} />.
            {currentTier ? (
              <span
                className={tierEligible ? "text-muted" : "text-destructive"}
              >
                {" "}
                Your tier: <TierLabel tier={currentTier} />.
              </span>
            ) : (
              <span> Connect a wallet to verify eligibility.</span>
            )}
          </span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Proposal title"
          />
          {attemptedNext && draft.title.trim().length === 0 ? (
            <p className="text-xs text-destructive">Title is required.</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="chamber">
            {isSystemProposal ? "Chamber" : "Chamber (optional)"}
          </Label>
          <Select
            id="chamber"
            value={
              allowSystemChamberSelect
                ? draft.chamberId
                : isSystemProposal
                  ? "general"
                  : draft.chamberId
            }
            disabled={isSystemProposal && !allowSystemChamberSelect}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                chamberId: e.target.value,
              }))
            }
          >
            <option value="">Select a chamber…</option>
            {!hasGeneralOption ? (
              <option value="general">General chamber</option>
            ) : null}
            {chamberOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {isSystemProposal ? (
            <p className="text-xs text-muted">
              {allowSystemChamberSelect
                ? "Dissolution can be submitted in General or the target chamber."
                : "System proposals must target General chamber."}
            </p>
          ) : null}
        </div>
      </div>

      {isSystemProposal ? (
        <div className="space-y-3 rounded-xl border border-border bg-panel-alt p-4">
          <p className="text-sm font-semibold text-text">System change</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="system-action">Action</Label>
              <Select
                id="system-action"
                value={draft.metaGovernance?.action ?? "chamber.create"}
                onChange={(e) => {
                  const action = e.target
                    .value as MetaGovernanceDraft["action"];
                  setDraft((prev) => {
                    const nextChamberId =
                      action === "chamber.dissolve"
                        ? prev.chamberId
                        : "general";
                    const nextMeta: MetaGovernanceDraft = {
                      action,
                      chamberId: prev.metaGovernance?.chamberId ?? "",
                      title:
                        action === "chamber.create"
                          ? (prev.metaGovernance?.title ?? "")
                          : "",
                      multiplier:
                        action === "chamber.create"
                          ? prev.metaGovernance?.multiplier
                          : undefined,
                      genesisMembers:
                        action === "chamber.create"
                          ? (prev.metaGovernance?.genesisMembers ?? [])
                          : [],
                    };
                    return {
                      ...prev,
                      metaGovernance: nextMeta,
                      chamberId: nextChamberId,
                    };
                  });
                }}
              >
                {Object.entries(SYSTEM_ACTIONS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted">
                {systemActionMeta.description}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="target-chamber-id">Target chamber id *</Label>
              {systemActionMeta.requiresTitle ? (
                <Input
                  id="target-chamber-id"
                  value={draft.metaGovernance?.chamberId ?? ""}
                  onChange={(e) => {
                    const chamberId = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      metaGovernance: {
                        ...(prev.metaGovernance ?? {
                          action: "chamber.create",
                          chamberId: "",
                          title: "",
                          genesisMembers: [],
                        }),
                        chamberId,
                      },
                      chamberId: "general",
                    }));
                  }}
                  placeholder="e.g., engineering"
                />
              ) : (
                <Select
                  id="target-chamber-id"
                  value={draft.metaGovernance?.chamberId ?? ""}
                  onChange={(e) => {
                    const chamberId = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      metaGovernance: {
                        ...(prev.metaGovernance ?? {
                          action: "chamber.create",
                          chamberId: "",
                          title: "",
                          genesisMembers: [],
                        }),
                        chamberId,
                      },
                      chamberId:
                        systemAction === "chamber.dissolve" &&
                        prev.chamberId !== "general"
                          ? chamberId
                          : prev.chamberId,
                    }));
                  }}
                >
                  <option value="">Select a chamber…</option>
                  {systemChamberOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
              {attemptedNext &&
              (draft.metaGovernance?.chamberId ?? "").trim().length === 0 ? (
                <p className="text-xs text-destructive">
                  Target chamber id is required.
                </p>
              ) : null}
            </div>
          </div>

          {systemActionMeta.requiresTitle ||
          systemActionMeta.showMultiplier ||
          systemActionMeta.showGenesisMembers ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {systemActionMeta.requiresTitle ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-title">Title *</Label>
                    <Input
                      id="target-title"
                      value={draft.metaGovernance?.title ?? ""}
                      onChange={(e) => {
                        const title = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            title,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="Engineering chamber"
                    />
                    {attemptedNext &&
                    (draft.metaGovernance?.title ?? "").trim().length === 0 ? (
                      <p className="text-xs text-destructive">
                        Title is required for chamber creation.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {systemActionMeta.showMultiplier ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-multiplier">
                      Multiplier (optional)
                    </Label>
                    <Input
                      id="target-multiplier"
                      value={
                        draft.metaGovernance?.multiplier === undefined ||
                        draft.metaGovernance?.multiplier === null
                          ? ""
                          : String(draft.metaGovernance.multiplier)
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const multiplier =
                          raw.length === 0 ? undefined : Number(raw);
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            multiplier:
                              multiplier === undefined ||
                              Number.isNaN(multiplier)
                                ? undefined
                                : multiplier,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="e.g., 3"
                      inputMode="decimal"
                    />
                  </div>
                ) : null}
              </div>
              {systemActionMeta.showGenesisMembers ? (
                <div className="space-y-1">
                  <Label htmlFor="genesis-members">
                    Genesis members (optional, choose active human nodes)
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      id="genesis-members"
                      value={selectedGenesisMember}
                      onChange={(e) => setSelectedGenesisMember(e.target.value)}
                    >
                      <option value="">
                        {activeHumanOptions.length === 0
                          ? "No active human nodes available"
                          : "Select a human node…"}
                      </option>
                      {availableGenesisOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedGenesisMember}
                      onClick={() => {
                        if (!selectedGenesisMember) return;
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            genesisMembers: Array.from(
                              new Set([
                                ...(prev.metaGovernance?.genesisMembers ?? []),
                                selectedGenesisMember,
                              ]),
                            ),
                          },
                          chamberId: "general",
                        }));
                        setSelectedGenesisMember("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {activeHumanError ? (
                    <p className="text-xs text-destructive">
                      {activeHumanError}
                    </p>
                  ) : null}
                  {(draft.metaGovernance?.genesisMembers ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(draft.metaGovernance?.genesisMembers ?? []).map(
                        (member) => (
                          <button
                            key={member}
                            type="button"
                            className="hover:border-border-strong rounded-full border border-border bg-panel px-3 py-1 text-xs text-text"
                            onClick={() => {
                              setDraft((prev) => ({
                                ...prev,
                                metaGovernance: {
                                  ...(prev.metaGovernance ?? {
                                    action: "chamber.create",
                                    chamberId: "",
                                    title: "",
                                    genesisMembers: [],
                                  }),
                                  genesisMembers: (
                                    prev.metaGovernance?.genesisMembers ?? []
                                  ).filter((value) => value !== member),
                                },
                                chamberId: "general",
                              }));
                            }}
                          >
                            {member} · remove
                          </button>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Leave empty to auto-include only the proposer.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="summary">Summary (optional)</Label>
        <Input
          id="summary"
          value={draft.summary}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, summary: e.target.value }))
          }
          placeholder="One line used in lists/cards"
        />
      </div>

      {isSystemProposal ? null : (
        <>
          <div className="space-y-1">
            <Label htmlFor="what">What *</Label>
            <textarea
              id="what"
              rows={5}
              className={textareaClassName}
              value={draft.what}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, what: e.target.value }))
              }
              placeholder="Describe the project/task you want to execute."
            />
            {attemptedNext && draft.what.trim().length === 0 ? (
              <p className="text-xs text-destructive">“What” is required.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="why">Why *</Label>
            <textarea
              id="why"
              rows={5}
              className={textareaClassName}
              value={draft.why}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, why: e.target.value }))
              }
              placeholder="Explain the expected contribution to Humanode."
            />
            {attemptedNext && draft.why.trim().length === 0 ? (
              <p className="text-xs text-destructive">“Why” is required.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
