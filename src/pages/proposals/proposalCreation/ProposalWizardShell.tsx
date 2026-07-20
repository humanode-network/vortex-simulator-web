import type { ReactNode, RefObject } from "react";

import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import type { ProposalWizardSessionV2 } from "./sessionStorage";
import type {
  WizardPathDefinition,
  WizardSaveStatus,
  WizardStepId,
} from "./wizardModel";
import "./ProposalWizard.css";

type WizardHeaderProps = {
  onSave: () => void;
  onSaveAndExit: () => void;
  onStartOver: () => void;
  pathLabel: string;
  saveStatus: WizardSaveStatus;
  saving: boolean;
};

const saveStatusLabel: Record<WizardSaveStatus, string> = {
  idle: "Not saved",
  "saved-local": "Saved locally",
  syncing: "Syncing",
  synced: "Synced",
  "sync-error": "Local copy safe",
};

export function WizardHeader({
  onSave,
  onSaveAndExit,
  onStartOver,
  pathLabel,
  saveStatus,
  saving,
}: WizardHeaderProps) {
  return (
    <GlassyCard as="article" className="proposal-wizard__header">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <GlassyStatusChip tone="primary">{pathLabel}</GlassyStatusChip>
          <GlassyStatusChip
            tone={
              saveStatus === "sync-error"
                ? "warn"
                : saveStatus === "synced"
                  ? "ok"
                  : "neutral"
            }
          >
            {saveStatusLabel[saveStatus]}
          </GlassyStatusChip>
        </div>
        <h1 className="mt-3 text-2xl leading-tight font-semibold text-text sm:text-3xl">
          Proposal Wizard
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Build the proposal in order. Completed steps remain available while
          the next requirement stays visible.
        </p>
      </div>
      <div className="proposal-wizard__header-actions">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "Saving" : "Save draft"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={onSaveAndExit}
        >
          Save and exit
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onStartOver}>
          Start over
        </Button>
      </div>
    </GlassyCard>
  );
}

type WizardProgressProps = {
  currentStepId: WizardStepId;
  onStepChange: (stepId: WizardStepId) => void;
  path: WizardPathDefinition;
  reachableStepIds: WizardStepId[];
};

export function WizardProgress({
  currentStepId,
  onStepChange,
  path,
  reachableStepIds,
}: WizardProgressProps) {
  const currentIndex = path.steps.findIndex(
    (step) => step.id === currentStepId,
  );
  return (
    <nav className="proposal-wizard__progress" aria-label="Proposal steps">
      {path.steps.map((step, index) => {
        const current = step.id === currentStepId;
        const complete = index < currentIndex;
        const reachable = reachableStepIds.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            className={cn(
              "proposal-wizard__progress-step",
              current && "is-current",
              complete && "is-complete",
              !reachable && "is-locked",
            )}
            aria-current={current ? "step" : undefined}
            aria-disabled={!reachable}
            disabled={!reachable}
            onClick={() => onStepChange(step.id)}
          >
            <span className="proposal-wizard__progress-index">
              {complete ? "OK" : index + 1}
            </span>
            <span className="proposal-wizard__progress-label">
              {step.shortLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

type WizardWorkspaceProps = {
  children: ReactNode;
  description: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
};

export function WizardWorkspace({
  children,
  description,
  headingRef,
  title,
}: WizardWorkspaceProps) {
  return (
    <GlassyCard as="article" className="proposal-wizard__workspace">
      <header className="proposal-wizard__workspace-heading">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-text sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </header>
      <div className="proposal-wizard__workspace-content">{children}</div>
    </GlassyCard>
  );
}

type WizardSummaryProps = {
  budgetTotal: number;
  chamber: string;
  initiative?: string | null;
  preset: string;
  title: string;
};

export function WizardSummary({
  budgetTotal,
  chamber,
  initiative,
  preset,
  title,
}: WizardSummaryProps) {
  const rows = [
    ["Title", title || "Not set"],
    ["Preset", preset || "Not selected"],
    ["Chamber", chamber || "Not selected"],
    ["Initiative", initiative || "None"],
    [
      "Budget",
      budgetTotal > 0 ? `${budgetTotal.toLocaleString()} HMND` : "None",
    ],
  ];
  return (
    <aside aria-label="Proposal summary">
      <GlassyCard className="proposal-wizard__summary">
        <h2 className="text-base font-semibold text-text">Proposal summary</h2>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="proposal-wizard__summary-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </GlassyCard>
    </aside>
  );
}

type WizardActionsProps = {
  backLabel: string;
  canGoBack: boolean;
  continueLabel: string;
  continueDisabled?: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function WizardActions({
  backLabel,
  canGoBack,
  continueDisabled = false,
  continueLabel,
  onBack,
  onContinue,
}: WizardActionsProps) {
  return (
    <footer className="proposal-wizard__actions">
      <Button
        type="button"
        variant="ghost"
        disabled={!canGoBack}
        onClick={onBack}
      >
        {backLabel}
      </Button>
      <Button type="button" disabled={continueDisabled} onClick={onContinue}>
        {continueLabel}
      </Button>
    </footer>
  );
}

type WizardRecoveryProps = {
  onDiscard: (sessionId: string) => void;
  onRecover: (session: ProposalWizardSessionV2) => void;
  sessions: ProposalWizardSessionV2[];
};

export function WizardRecovery({
  onDiscard,
  onRecover,
  sessions,
}: WizardRecoveryProps) {
  if (sessions.length === 0) return null;
  return (
    <GlassyCard className="proposal-wizard__recovery">
      <div>
        <h2 className="text-base font-semibold text-text">
          Unfinished proposal
        </h2>
        <p className="mt-1 text-sm text-muted">
          Continue saved local work or leave it untouched and keep this new
          proposal.
        </p>
      </div>
      <div className="proposal-wizard__recovery-list">
        {sessions.slice(0, 3).map((session) => (
          <div
            key={session.sessionId}
            className="proposal-wizard__recovery-row"
          >
            <div className="min-w-0">
              <strong>{session.form.title || "Untitled proposal"}</strong>
              <span>{new Date(session.updatedAt).toLocaleString()}</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRecover(session)}
              >
                Continue
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onDiscard(session.sessionId)}
              >
                Discard
              </Button>
            </div>
          </div>
        ))}
      </div>
    </GlassyCard>
  );
}
