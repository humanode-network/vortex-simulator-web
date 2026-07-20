import type React from "react";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { newId } from "../ids";
import type { ProposalDraftForm } from "../types";

export function PlanStep(props: {
  attemptedNext: boolean;
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  formationEligible?: boolean;
  mode: "project" | "system";
}) {
  const { attemptedNext, draft, setDraft, formationEligible, mode } = props;
  const showTimeline = formationEligible !== false;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="how">
          {mode === "system"
            ? "How (implementation) *"
            : "How (execution plan) *"}
        </Label>
        <ProposalNarrativeEditor
          id="how"
          value={draft.how}
          onChange={(value) => setDraft((prev) => ({ ...prev, how: value }))}
          placeholder={
            mode === "system"
              ? "Explain how the system change should be applied and verified."
              : "Execution plan: steps, responsibilities, risks, checkpoints."
          }
        />
        {attemptedNext && draft.how.trim().length === 0 ? (
          <p className="text-xs text-destructive">
            {mode === "system"
              ? "Implementation notes are required."
              : "Execution plan is required."}
          </p>
        ) : null}
      </div>

      {mode === "system" ? null : (
        <>
          {showTimeline ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text">When</p>
                  <p className="text-xs text-muted">
                    Timeline is recommended (milestones).
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      timeline: [
                        ...prev.timeline,
                        {
                          id: newId("ms"),
                          title: "",
                          timeframe: "",
                          budgetHmnd: "",
                        },
                      ],
                    }))
                  }
                >
                  Add milestone
                </Button>
              </div>
              <div className="space-y-2">
                {draft.timeline.map((ms) => (
                  <div
                    key={ms.id}
                    className="proposal-wizard__collection-row grid gap-2 sm:grid-cols-[1fr_200px_auto]"
                  >
                    <Input
                      value={ms.title}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          timeline: prev.timeline.map((item) =>
                            item.id === ms.id
                              ? { ...item, title: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Milestone title"
                    />
                    <Input
                      value={ms.timeframe}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          timeline: prev.timeline.map((item) =>
                            item.id === ms.id
                              ? { ...item, timeframe: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Timeframe (e.g., 2 weeks)"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          timeline: prev.timeline.filter(
                            (item) => item.id !== ms.id,
                          ),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text">Where</p>
                <p className="text-xs text-muted">
                  Links to platforms or public outcomes (optional).
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    outputs: [
                      ...prev.outputs,
                      { id: newId("out"), label: "", url: "" },
                    ],
                  }))
                }
              >
                Add link
              </Button>
            </div>
            <div className="space-y-2">
              {draft.outputs.map((out) => (
                <div
                  key={out.id}
                  className="proposal-wizard__collection-row grid gap-2 sm:grid-cols-[220px_1fr_auto]"
                >
                  <Input
                    value={out.label}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.map((item) =>
                          item.id === out.id
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    placeholder="Label (e.g., GitHub, Notion)"
                  />
                  <Input
                    value={out.url}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.map((item) =>
                          item.id === out.id
                            ? { ...item, url: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    placeholder="https://…"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.filter(
                          (item) => item.id !== out.id,
                        ),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {showTimeline ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text">
                    Team needs (open positions)
                  </p>
                  <p className="text-xs text-muted">
                    Define roles you need in Formation. Team slots are derived
                    from this list.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      openSlotNeeds: [
                        ...prev.openSlotNeeds,
                        { id: newId("slot"), title: "", desc: "" },
                      ],
                    }))
                  }
                >
                  Add role
                </Button>
              </div>
              <div className="space-y-2">
                {draft.openSlotNeeds.map((slot) => (
                  <div
                    key={slot.id}
                    className="proposal-wizard__collection-row grid gap-2 sm:grid-cols-[220px_1fr_auto]"
                  >
                    <Input
                      value={slot.title}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          openSlotNeeds: prev.openSlotNeeds.map((item) =>
                            item.id === slot.id
                              ? { ...item, title: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Role title (e.g., Frontend dev)"
                    />
                    <Input
                      value={slot.desc}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          openSlotNeeds: prev.openSlotNeeds.map((item) =>
                            item.id === slot.id
                              ? { ...item, desc: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Why needed / scope"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          openSlotNeeds: prev.openSlotNeeds.filter(
                            (item) => item.id !== slot.id,
                          ),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {draft.openSlotNeeds.length === 0 ? (
                  <p className="text-xs text-muted">
                    No open positions defined. Team slots will stay at proposer
                    only.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
