import type React from "react";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import type { ProposalDraftForm } from "../types";

export function BudgetStep(props: {
  attemptedNext: boolean;
  budgetTotal: number;
  budgetValid: boolean;
  draft: ProposalDraftForm;
  formationEligible?: boolean;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
}) {
  const {
    attemptedNext,
    budgetTotal,
    budgetValid,
    draft,
    formationEligible,
    setDraft,
  } = props;
  const alignedToMilestones = formationEligible !== false;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-text">How much</p>
          <p className="text-xs text-muted">
            {alignedToMilestones
              ? "Budget is aligned per milestone. Edit the HMND amount for each milestone."
              : "Detailed budget items (required to submit)."}
          </p>
        </div>
        {alignedToMilestones ? (
          <div className="space-y-2">
            {draft.timeline.length === 0 ? (
              <p className="text-xs text-muted">
                Add milestones first in Plan step to define milestone budgets.
              </p>
            ) : (
              draft.timeline.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[1fr_220px_160px]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-muted">Milestone</Label>
                    <p className="text-sm text-text">
                      {item.title.trim().length > 0
                        ? item.title
                        : `Milestone ${idx + 1}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted">Timeframe</Label>
                    <p className="text-sm text-text">
                      {item.timeframe.trim().length > 0
                        ? item.timeframe
                        : "Timeline TBD"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted">Budget (HMND)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={item.budgetHmnd ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          timeline: prev.timeline.map((row) =>
                            row.id === item.id
                              ? { ...row, budgetHmnd: e.target.value }
                              : row,
                          ),
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {draft.budgetItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[1fr_160px]"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-muted">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        budgetItems: prev.budgetItems.map((row) =>
                          row.id === item.id
                            ? { ...row, description: e.target.value }
                            : row,
                        ),
                      }))
                    }
                    placeholder="Work package, audit, design…"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted">HMND</Label>
                  <Input
                    value={item.amount}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        budgetItems: prev.budgetItems.map((row) =>
                          row.id === item.id
                            ? { ...row, amount: e.target.value }
                            : row,
                        ),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-panel-alt px-4 py-3">
        <p className="text-sm font-semibold text-text">Total</p>
        <p className="text-lg font-semibold text-text">
          {budgetTotal.toLocaleString()} HMND
        </p>
      </div>

      {attemptedNext && !budgetValid ? (
        <p className="text-xs text-destructive">
          {alignedToMilestones
            ? "Set a positive HMND budget for each milestone."
            : "Add at least one budget line item with a positive amount."}
        </p>
      ) : null}
    </div>
  );
}
