import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { PageHint } from "@/components/PageHint";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { apiProposalDraftSave, apiProposalSubmitToPool } from "@/lib/apiClient";
import { toTimestampMs } from "@/lib/dateTime";
import { initiativeOptionsWithSelection } from "@/lib/initiativeUi";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import {
  ProposalCreationLineageMessage,
  ProposalCreationMessages,
} from "./proposalCreation/ProposalCreationMessages";
import {
  WizardActions,
  WizardHeader,
  WizardProgress,
  WizardRecovery,
  WizardSummary,
  WizardWorkspace,
} from "./proposalCreation/ProposalWizardShell";
import {
  applyPresetToDraft,
  getProposalPreset,
  PROPOSAL_PRESETS,
} from "./proposalCreation/presets/registry";
import {
  createProposalWizardSessionRepository,
  mergeProposalWizardServerSave,
  type ProposalWizardSessionV2,
} from "./proposalCreation/sessionStorage";
import { proposalSubmitErrorStep } from "./proposalCreation/submitErrorRouting";
import { BudgetStep } from "./proposalCreation/steps/BudgetStep";
import { IntentStep } from "./proposalCreation/steps/IntentStep";
import { PlanStep } from "./proposalCreation/steps/PlanStep";
import { ProjectEssentialsStep } from "./proposalCreation/steps/ProjectEssentialsStep";
import { ReviewStep } from "./proposalCreation/steps/ReviewStep";
import { SystemChangeStep } from "./proposalCreation/steps/SystemChangeStep";
import { draftToApiForm } from "./proposalCreation/toApiForm";
import {
  DEFAULT_DRAFT,
  type ProposalDraftForm,
} from "./proposalCreation/types";
import {
  useProposalDraftHydration,
  type ProposalDraftHydrationResult,
} from "./proposalCreation/useProposalDraftHydration";
import { useProposalCreationComputed } from "./proposalCreation/useProposalCreationComputed";
import { useProposalCreationReferenceData } from "./proposalCreation/useProposalCreationReferenceData";
import {
  createWizardState,
  pathDefinition,
  pathIdForDraft,
  reachableWizardSteps,
  resolveRequestedWizardStep,
  stepDefinition,
  transitionWizard,
  validateWizardStep,
  type WizardContext,
  type WizardEffect,
  type WizardEvent,
  type WizardStepId,
} from "./proposalCreation/wizardModel";

const stepDescriptions: Record<WizardStepId, string> = {
  intent: "Choose the governing right, proposal structure, and preset.",
  essentials: "Set the proposal identity, chamber context, and public case.",
  plan: "Describe execution, outputs, milestones, and team requirements.",
  funding: "Align a positive HMND budget with every Formation milestone.",
  "system-change": "Identify the executable action and its canonical target.",
  rationale: "Explain how the system change should be applied and verified.",
  review: "Confirm the proposal, supporting material, and submission rules.",
};

function legacyStepToWizardStep(
  value: string,
  templateId: "project" | "system",
): string {
  if (value === "essentials") {
    return templateId === "system" ? "system-change" : "essentials";
  }
  if (value === "plan") {
    return templateId === "system" ? "rationale" : "plan";
  }
  if (value === "budget") return "funding";
  return value;
}

function initialSession(
  repository: ReturnType<typeof createProposalWizardSessionRepository>,
  searchParams: URLSearchParams,
): ProposalWizardSessionV2 {
  repository.migrateLegacy();
  const requestedDraftId = (searchParams.get("draftId") ?? "").trim();
  if (requestedDraftId) {
    return (
      repository.findByDraftId(requestedDraftId) ??
      repository.create({ draftId: requestedDraftId })
    );
  }
  const requestedSessionId = (searchParams.get("session") ?? "").trim();
  if (requestedSessionId) {
    const requested = repository.get(requestedSessionId);
    if (requested) return requested;
  }
  const resubmitsProposalId = (
    searchParams.get("resubmitsProposalId") ?? ""
  ).trim();
  return repository.create({
    ...(resubmitsProposalId ? { resubmitsProposalId } : {}),
  });
}

function initialWizardStateForSession(
  session: ProposalWizardSessionV2,
  searchParams: URLSearchParams,
) {
  const pathId = pathIdForDraft(session.form, session.templateId);
  const requestedStep = legacyStepToWizardStep(
    searchParams.get("step") ?? session.lastVisitedStep,
    session.templateId,
  );
  const stepId = resolveRequestedWizardStep(pathId, requestedStep, {
    draft: session.form,
    presetId: session.presetId,
    tierBlocked: false,
  });
  return createWizardState(pathId, stepId);
}

const ProposalCreation: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const repository = useMemo(
    () => createProposalWizardSessionRepository(window.localStorage),
    [],
  );
  const [session, setSession] = useState(() =>
    initialSession(repository, searchParams),
  );
  const sessionRef = useRef(session);
  const [draft, setDraft] = useState<ProposalDraftForm>(session.form);
  const [presetId, setPresetId] = useState(session.presetId);
  const [templateKind, setTemplateKind] = useState<"project" | "system">(
    session.templateId,
  );
  const [wizardState, setWizardState] = useState(() =>
    initialWizardStateForSession(session, searchParams),
  );
  const [savedAt, setSavedAt] = useState<number | null>(
    session.serverSavedAt
      ? toTimestampMs(session.serverSavedAt, Date.now())
      : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recoverableSessions, setRecoverableSessions] = useState(() =>
    repository.listRecoverable(session.sessionId),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saveInFlightBySession = useRef(
    new Map<string, Promise<string | null>>(),
  );
  const submitInFlight = useRef(false);
  const requestedStepRef = useRef(searchParams.get("step") ?? "");

  const {
    chamberOptions,
    chambers,
    initiativeOptions,
    initiatives,
    tierProgress,
  } = useProposalCreationReferenceData({
    authEnabled: auth.enabled,
    authenticated: auth.authenticated,
  });

  const {
    budgetTotal,
    computed,
    currentTier,
    guardedComputed,
    requiredTier,
    selectedChamber,
    template,
    tierBlocked,
    tierEligible,
  } = useProposalCreationComputed({
    chambers,
    draft,
    templateKind,
    tierProgress,
  });

  const wizardContext = useMemo<WizardContext>(
    () => ({ draft, presetId, tierBlocked }),
    [draft, presetId, tierBlocked],
  );
  const currentPathId = pathIdForDraft(draft, templateKind);
  const currentPath = pathDefinition(currentPathId);
  const currentStep = stepDefinition(currentPathId, wizardState.stepId);
  const reachableSteps = reachableWizardSteps(currentPathId, wizardContext);
  const currentStepIndex = currentPath.steps.findIndex(
    (step) => step.id === wizardState.stepId,
  );
  const isReview = wizardState.stepId === "review";
  const canAct = !SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible);
  const fullPathValid = currentPath.steps.every(
    (step) => validateWizardStep(step.id, wizardContext).valid,
  );
  const submitDisabled =
    !fullPathValid ||
    !guardedComputed.canSubmit ||
    !canAct ||
    tierBlocked ||
    wizardState.submitStatus === "submitting";
  const selectedInitiative = useMemo(() => {
    if (!draft.initiativeId) return null;
    const initiative = initiatives.find(
      (item) => item.id === draft.initiativeId,
    );
    return initiative
      ? { id: initiative.id, title: initiative.title }
      : {
          id: draft.initiativeId,
          title: "Unavailable or no longer managed",
        };
  }, [draft.initiativeId, initiatives]);
  const visibleInitiativeOptions = useMemo(
    () => initiativeOptionsWithSelection(initiativeOptions, draft.initiativeId),
    [draft.initiativeId, initiativeOptions],
  );
  const selectedPreset = PROPOSAL_PRESETS.find(
    (preset) => preset.id === presetId,
  );
  const availableChamberIds = useMemo(() => {
    const ids = chamberOptions.map((option) => option.value);
    return ids.some((id) => id.toLowerCase() === "general")
      ? ids
      : [...ids, "general"];
  }, [chamberOptions]);
  const requestedDraftId = (searchParams.get("draftId") ?? "").trim();
  const textareaClassName =
    "w-full rounded-lg border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition supports-[backdrop-filter]:backdrop-blur-md hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

  const runEffects = useCallback((effects: WizardEffect[]) => {
    window.requestAnimationFrame(() => {
      for (const effect of effects) {
        if (effect.type === "focus-step") {
          headingRef.current?.focus({ preventScroll: true });
          headingRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        } else {
          const field = document.getElementById(effect.fieldId);
          field?.focus({ preventScroll: true });
          field?.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    });
  }, []);

  const send = useCallback(
    (event: WizardEvent) => {
      setWizardState((current) => {
        const result = transitionWizard(current, event, wizardContext);
        runEffects(result.effects);
        return result.state;
      });
    },
    [runEffects, wizardContext],
  );

  const persistCurrentSession = useCallback(
    (overrides?: Partial<ProposalWizardSessionV2>, updateReactState = true) => {
      const saved = repository.save({
        ...sessionRef.current,
        ...overrides,
        form: overrides?.form ?? draft,
        templateId: overrides?.templateId ?? templateKind,
        presetId: overrides?.presetId ?? presetId,
        pathId: pathIdForDraft(
          overrides?.form ?? draft,
          overrides?.templateId ?? templateKind,
        ),
        lastVisitedStep: overrides?.lastVisitedStep ?? wizardState.stepId,
      });
      sessionRef.current = saved;
      if (updateReactState) setSession(saved);
      return saved;
    },
    [draft, presetId, repository, templateKind, wizardState.stepId],
  );

  useEffect(() => {
    if (wizardState.pathId === currentPathId) return;
    send({ type: "PATH_CHANGED", pathId: currentPathId });
  }, [currentPathId, send, wizardState.pathId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      persistCurrentSession(undefined, false);
      send({ type: "LOCAL_SAVE_COMPLETED" });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [
    draft,
    persistCurrentSession,
    presetId,
    send,
    templateKind,
    wizardState.stepId,
  ]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("session", session.sessionId);
    next.set("step", wizardState.stepId);
    if (session.draftId) next.set("draftId", session.draftId);
    else next.delete("draftId");
    if (session.resubmitsProposalId) {
      next.set("resubmitsProposalId", session.resubmitsProposalId);
    } else {
      next.delete("resubmitsProposalId");
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    searchParams,
    session.draftId,
    session.resubmitsProposalId,
    session.sessionId,
    setSearchParams,
    wizardState.stepId,
  ]);

  const activateSession = useCallback(
    (nextSession: ProposalWizardSessionV2, requestedStep?: string) => {
      const nextDraft = nextSession.form;
      const nextPathId = pathIdForDraft(nextDraft, nextSession.templateId);
      const nextContext: WizardContext = {
        draft: nextDraft,
        presetId: nextSession.presetId,
        tierBlocked: false,
      };
      const resolvedStep = resolveRequestedWizardStep(
        nextPathId,
        legacyStepToWizardStep(
          requestedStep ?? nextSession.lastVisitedStep,
          nextSession.templateId,
        ),
        nextContext,
      );
      sessionRef.current = nextSession;
      setSession(nextSession);
      setDraft(nextDraft);
      setPresetId(nextSession.presetId);
      setTemplateKind(nextSession.templateId);
      setWizardState(createWizardState(nextPathId, resolvedStep));
      setSavedAt(
        nextSession.serverSavedAt
          ? toTimestampMs(nextSession.serverSavedAt, Date.now())
          : null,
      );
      setSaveError(null);
      setSubmitError(null);
      setRecoverableSessions(repository.listRecoverable(nextSession.sessionId));
      runEffects([{ type: "focus-step", stepId: resolvedStep }]);
    },
    [repository, runEffects],
  );

  const handleDraftLoaded = useCallback(
    ({
      draft: nextDraft,
      draftId,
      presetId: nextPresetId,
      templateKind: nextTemplateKind,
    }: ProposalDraftHydrationResult) => {
      const nextPathId = pathIdForDraft(nextDraft, nextTemplateKind);
      const requestedStep = legacyStepToWizardStep(
        requestedStepRef.current,
        nextTemplateKind,
      );
      const resolvedStep = resolveRequestedWizardStep(
        nextPathId,
        requestedStep,
        {
          draft: nextDraft,
          presetId: nextPresetId,
          tierBlocked: false,
        },
      );
      const saved = repository.save({
        ...sessionRef.current,
        draftId,
        form: nextDraft,
        presetId: nextPresetId,
        templateId: nextTemplateKind,
        pathId: nextPathId,
        lastVisitedStep: resolvedStep,
        serverSavedAt: new Date().toISOString(),
      });
      activateSession(saved, resolvedStep);
      setSavedAt(Date.now());
    },
    [activateSession, repository],
  );

  const { loadDraftError, loadingDraftId } = useProposalDraftHydration({
    navigate,
    onDraftLoaded: handleDraftLoaded,
    requestedDraftId,
  });

  const handleTemplateChange = (nextTemplate: "project" | "system") => {
    setPresetId("");
    setTemplateKind(nextTemplate);
    setDraft((previous) =>
      nextTemplate === "system"
        ? {
            ...previous,
            chamberId: "general",
            formationEligible: false,
            proposalType: "administrative",
            metaGovernance: undefined,
          }
        : {
            ...previous,
            formationEligible: true,
            proposalType: "basic",
            metaGovernance: undefined,
          },
    );
  };

  const handlePresetChange = (nextPresetId: string) => {
    if (!nextPresetId) {
      setPresetId("");
      return;
    }
    const preset = getProposalPreset(nextPresetId);
    setPresetId(preset.id);
    setTemplateKind(preset.templateId);
    setDraft((previous) => {
      const next = applyPresetToDraft(previous, preset);
      return preset.templateId === "system"
        ? { ...next, chamberId: "general" }
        : next;
    });
  };

  const saveDraftNow = useCallback(() => {
    const sessionId = sessionRef.current.sessionId;
    const existing = saveInFlightBySession.current.get(sessionId);
    if (existing) return existing;

    const operation = (async () => {
      const local = persistCurrentSession({ form: draft });
      send({ type: "LOCAL_SAVE_COMPLETED" });
      setSavedAt(Date.now());
      setSaveError(null);
      if (!canAct) {
        setSaveError("Saved locally. Connect and verify to sync this draft.");
        return local.draftId ?? null;
      }

      send({ type: "SERVER_SAVE_REQUESTED" });
      try {
        const response = await apiProposalDraftSave({
          ...(local.draftId ? { draftId: local.draftId } : {}),
          form: draftToApiForm(draft, { templateId: template.id }),
        });
        const serverSavedAt = new Date(
          toTimestampMs(response.updatedAt, Date.now()),
        ).toISOString();
        const latest = repository.get(sessionId) ?? local;
        const merged = mergeProposalWizardServerSave({
          draftId: response.draftId,
          latest,
          requested: local,
          serverSavedAt,
        });
        const synced = repository.save(merged.session);
        if (sessionRef.current.sessionId === sessionId) {
          sessionRef.current = synced;
          setSession(synced);
          setSavedAt(toTimestampMs(response.updatedAt, Date.now()));
          send({ type: "SERVER_SAVE_SUCCEEDED" });
          if (merged.changedDuringSync) send({ type: "LOCAL_SAVE_COMPLETED" });
        }
        return response.draftId;
      } catch (error) {
        if (sessionRef.current.sessionId === sessionId) {
          setSaveError((error as Error).message);
          send({ type: "SERVER_SAVE_FAILED" });
        }
        return null;
      }
    })();

    saveInFlightBySession.current.set(sessionId, operation);
    void operation.finally(() => {
      if (saveInFlightBySession.current.get(sessionId) === operation) {
        saveInFlightBySession.current.delete(sessionId);
      }
    });
    return operation;
  }, [canAct, draft, persistCurrentSession, repository, send, template.id]);

  const submitProposal = async () => {
    if (submitDisabled || submitInFlight.current) return;
    submitInFlight.current = true;
    setSubmitError(null);
    send({ type: "SUBMIT_REQUESTED" });
    try {
      const draftId = await saveDraftNow();
      if (!draftId) throw new Error("Draft could not be synchronized.");
      const response = await apiProposalSubmitToPool({ draftId });
      repository.remove(session.sessionId);
      if (session.legacyRecovery) repository.clearLegacy();
      navigate(`/app/proposals/${response.proposalId}/pp`, { replace: true });
    } catch (error) {
      const message = formatProposalSubmitError(error);
      setSubmitError(message);
      const targetStep = proposalSubmitErrorStep(
        error,
        currentPathId,
        wizardContext,
      );
      if (targetStep) {
        send({ type: "STEP_REQUESTED", stepId: targetStep });
      }
      send({ type: "SUBMIT_FAILED" });
    } finally {
      submitInFlight.current = false;
    }
  };

  const handleContinue = () => {
    if (isReview) {
      void submitProposal();
      return;
    }
    send({ type: "CONTINUE_REQUESTED" });
  };

  const handleStartOver = () => {
    if (!window.confirm("Start a clean proposal? The server draft is kept.")) {
      return;
    }
    if (session.draftId) {
      const clean = repository.create();
      activateSession(clean, "intent");
      return;
    }
    const cleanDraft = structuredClone(DEFAULT_DRAFT);
    setDraft(cleanDraft);
    setPresetId("");
    setTemplateKind("project");
    setWizardState(createWizardState("project-formation", "intent"));
    setSaveError(null);
    setSubmitError(null);
    setSavedAt(null);
  };

  const handleSaveAndExit = async () => {
    await saveDraftNow();
    navigate(
      session.draftId || canAct ? "/app/proposals/drafts" : "/app/proposals",
    );
  };

  const handleRecover = (nextSession: ProposalWizardSessionV2) => {
    activateSession(nextSession);
  };

  const handleDiscardRecovery = (sessionId: string) => {
    const discarded = repository.get(sessionId);
    repository.remove(sessionId);
    if (discarded?.legacyRecovery) repository.clearLegacy();
    setRecoverableSessions(repository.listRecoverable(session.sessionId));
  };

  const attemptedNext = wizardState.attemptedStepId === wizardState.stepId;
  const summaryInitiative = selectedInitiative?.title ?? null;

  return (
    <div className="proposal-wizard">
      <PageHint pageId="proposals" />
      <ProposalCreationLineageMessage
        resubmitsProposalId={draft.resubmitsProposalId}
      />
      <WizardHeader
        onSave={() => void saveDraftNow()}
        onSaveAndExit={() => void handleSaveAndExit()}
        onStartOver={handleStartOver}
        pathLabel={currentPath.label}
        saveStatus={wizardState.saveStatus}
        saving={wizardState.saveStatus === "syncing"}
      />
      <WizardRecovery
        sessions={recoverableSessions}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
      />
      <WizardProgress
        currentStepId={wizardState.stepId}
        path={currentPath}
        reachableStepIds={reachableSteps}
        onStepChange={(stepId) => send({ type: "STEP_REQUESTED", stepId })}
      />

      <ProposalCreationMessages
        currentTier={currentTier}
        loadDraftError={loadDraftError}
        loadingDraftId={loadingDraftId}
        requiredTier={requiredTier}
        saveError={saveError}
        submitError={submitError}
        tierBlocked={tierBlocked}
      />

      <div className="proposal-wizard__body">
        <WizardWorkspace
          headingRef={headingRef}
          title={currentStep.title}
          description={stepDescriptions[wizardState.stepId]}
        >
          {wizardState.stepId === "intent" ? (
            <IntentStep
              availableChamberIds={availableChamberIds}
              currentTier={currentTier}
              draft={draft}
              onPresetChange={handlePresetChange}
              onTemplateChange={handleTemplateChange}
              presetId={presetId}
              presets={PROPOSAL_PRESETS}
              requiredTier={requiredTier}
              sessionId={session.sessionId}
              setDraft={setDraft}
              templateId={templateKind}
              tierEligible={tierEligible}
            />
          ) : null}

          {wizardState.stepId === "essentials" ? (
            <ProjectEssentialsStep
              attemptedNext={attemptedNext}
              chamberOptions={chamberOptions}
              draft={draft}
              initiativeOptions={visibleInitiativeOptions}
              setDraft={setDraft}
            />
          ) : null}

          {wizardState.stepId === "system-change" ? (
            <SystemChangeStep
              attemptedNext={attemptedNext}
              draft={draft}
              initiativeOptions={visibleInitiativeOptions}
              setDraft={setDraft}
              textareaClassName={textareaClassName}
            />
          ) : null}

          {wizardState.stepId === "plan" ||
          wizardState.stepId === "rationale" ? (
            <PlanStep
              attemptedNext={attemptedNext}
              draft={draft}
              setDraft={setDraft}
              formationEligible={draft.formationEligible}
              mode={templateKind}
            />
          ) : null}

          {wizardState.stepId === "funding" ? (
            <BudgetStep
              attemptedNext={attemptedNext}
              budgetTotal={budgetTotal}
              budgetValid={computed.budgetValid}
              draft={draft}
              formationEligible={draft.formationEligible}
              setDraft={setDraft}
            />
          ) : null}

          {wizardState.stepId === "review" ? (
            <ReviewStep
              budgetTotal={budgetTotal}
              canAct={canAct}
              canSubmit={guardedComputed.canSubmit}
              draft={draft}
              formationEligible={draft.formationEligible}
              mode={templateKind}
              proposerAddress={auth.address ?? null}
              selectedChamber={selectedChamber}
              selectedInitiative={selectedInitiative}
              setDraft={setDraft}
              textareaClassName={textareaClassName}
            />
          ) : null}

          <WizardActions
            backLabel="Back"
            canGoBack={currentStepIndex > 0}
            continueDisabled={isReview && submitDisabled}
            continueLabel={
              isReview
                ? wizardState.submitStatus === "submitting"
                  ? "Submitting"
                  : "Submit proposal"
                : "Continue"
            }
            onBack={() => send({ type: "BACK_REQUESTED" })}
            onContinue={handleContinue}
          />
        </WizardWorkspace>

        <WizardSummary
          budgetTotal={budgetTotal}
          chamber={selectedChamber?.name ?? draft.chamberId}
          initiative={summaryInitiative}
          preset={selectedPreset?.label ?? ""}
          title={draft.title}
        />
      </div>

      {savedAt ? (
        <p className="text-right text-xs text-muted">
          Last saved {new Date(savedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
};

export default ProposalCreation;
