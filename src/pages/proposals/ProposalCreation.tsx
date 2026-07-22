import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { PageHint } from "@/components/PageHint";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { apiProposalSubmitToPool } from "@/lib/apiClient";
import { toTimestampMs } from "@/lib/dateTime";
import { initiativeOptionsWithSelection } from "@/lib/initiativeUi";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
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
  type ProposalWizardSessionV2,
} from "./proposalCreation/sessionStorage";
import { proposalSubmitErrorStep } from "./proposalCreation/submitErrorRouting";
import { BudgetStep } from "./proposalCreation/steps/BudgetStep";
import { IntentStep } from "./proposalCreation/steps/IntentStep";
import { PlanStep } from "./proposalCreation/steps/PlanStep";
import { ProjectEssentialsStep } from "./proposalCreation/steps/ProjectEssentialsStep";
import { ReviewStep } from "./proposalCreation/steps/ReviewStep";
import { SystemChangeStep } from "./proposalCreation/steps/SystemChangeStep";
import {
  DEFAULT_DRAFT,
  type ProposalDraftForm,
} from "./proposalCreation/types";
import {
  useProposalDraftHydration,
  type ProposalDraftHydrationResult,
} from "./proposalCreation/useProposalDraftHydration";
import { useProposalWizardSave } from "./proposalCreation/useProposalWizardSave";
import { useProposalCreationComputed } from "./proposalCreation/useProposalCreationComputed";
import { useProposalCreationReferenceData } from "./proposalCreation/useProposalCreationReferenceData";
import {
  createWizardState,
  pathDefinition,
  pathIdForDraft,
  reachableWizardSteps,
  normalizeWizardStepId,
  resolveRequestedWizardStep,
  stepDefinition,
  transitionWizard,
  validateWizardStep,
  type WizardContext,
  type WizardEffect,
  type WizardEvent,
} from "./proposalCreation/wizardModel";

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
  const requestedStep = normalizeWizardStepId(
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
  const prefersReducedMotion = usePrefersReducedMotion();
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
  const submitInFlight = useRef(false);
  const observedQueryRef = useRef(searchParams.toString());
  const pendingInternalQueryRef = useRef<string | null>(null);

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
    budgetValid,
    currentTier,
    requiredTier,
    selectedChamber,
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
    !fullPathValid ||
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
  const requestedSessionId = (searchParams.get("session") ?? "").trim();
  const requestedStep = searchParams.get("step") ?? "";
  const textareaClassName =
    "w-full rounded-lg border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition supports-[backdrop-filter]:backdrop-blur-md hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

  const runEffects = useCallback(
    (effects: WizardEffect[]) => {
      const behavior = prefersReducedMotion ? "auto" : "smooth";
      window.requestAnimationFrame(() => {
        for (const effect of effects) {
          if (effect.type === "focus-step") {
            headingRef.current?.focus({ preventScroll: true });
            headingRef.current?.scrollIntoView({
              block: "nearest",
              behavior,
            });
          } else {
            const field = document.getElementById(effect.fieldId);
            field?.focus({ preventScroll: true });
            field?.scrollIntoView({ block: "center", behavior });
          }
        }
      });
    },
    [prefersReducedMotion],
  );

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
    const currentQuery = searchParams.toString();
    if (
      currentQuery !== observedQueryRef.current &&
      currentQuery !== pendingInternalQueryRef.current
    ) {
      return;
    }
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
      pendingInternalQueryRef.current = next.toString();
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
        normalizeWizardStepId(
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
      const requestedWizardStep = normalizeWizardStepId(
        requestedStep,
        nextTemplateKind,
      );
      const resolvedStep = resolveRequestedWizardStep(
        nextPathId,
        requestedWizardStep,
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
    [activateSession, repository, requestedStep],
  );

  useEffect(() => {
    const currentQuery = searchParams.toString();
    if (currentQuery === observedQueryRef.current) return;
    if (currentQuery === pendingInternalQueryRef.current) {
      observedQueryRef.current = currentQuery;
      pendingInternalQueryRef.current = null;
      return;
    }
    observedQueryRef.current = currentQuery;
    if (requestedDraftId) return;

    if (
      requestedSessionId &&
      requestedSessionId !== sessionRef.current.sessionId
    ) {
      const nextSession = repository.get(requestedSessionId);
      const resubmitsProposalId = (
        searchParams.get("resubmitsProposalId") ?? ""
      ).trim();
      persistCurrentSession(undefined, false);
      activateSession(
        nextSession ??
          repository.create({
            ...(resubmitsProposalId ? { resubmitsProposalId } : {}),
          }),
        requestedStep,
      );
      return;
    }

    if (!requestedSessionId) {
      const resubmitsProposalId = (
        searchParams.get("resubmitsProposalId") ?? ""
      ).trim();
      persistCurrentSession(undefined, false);
      activateSession(
        repository.create({
          ...(resubmitsProposalId ? { resubmitsProposalId } : {}),
        }),
        requestedStep,
      );
      return;
    }

    if (requestedSessionId !== sessionRef.current.sessionId) return;

    const nextStep = resolveRequestedWizardStep(
      currentPathId,
      normalizeWizardStepId(requestedStep, templateKind),
      wizardContext,
    );
    if (nextStep === wizardState.stepId) return;
    setWizardState((current) => ({
      ...current,
      attemptedStepId: null,
      pathId: currentPathId,
      stepId: nextStep,
    }));
    runEffects([{ type: "focus-step", stepId: nextStep }]);
  }, [
    activateSession,
    currentPathId,
    persistCurrentSession,
    repository,
    requestedDraftId,
    requestedSessionId,
    requestedStep,
    runEffects,
    searchParams,
    templateKind,
    wizardContext,
    wizardState.stepId,
  ]);

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

  const saveDraftNow = useProposalWizardSave({
    canAct,
    draft,
    onSaveError: setSaveError,
    onSavedAt: setSavedAt,
    onSessionSynced: setSession,
    persistSession: persistCurrentSession,
    presetId,
    repository,
    send,
    sessionRef,
    templateId: templateKind,
  });

  const submitProposal = async () => {
    if (submitDisabled || submitInFlight.current) return;
    const submittingSession = sessionRef.current;
    submitInFlight.current = true;
    setSubmitError(null);
    send({ type: "SUBMIT_REQUESTED" });
    try {
      const draftId = await saveDraftNow();
      if (!draftId) throw new Error("Draft could not be synchronized.");
      const response = await apiProposalSubmitToPool({ draftId });
      if (sessionRef.current.sessionId !== submittingSession.sessionId) return;
      repository.remove(submittingSession.sessionId);
      if (submittingSession.legacyRecovery) repository.clearLegacy();
      navigate(`/app/proposals/${response.proposalId}/pp`, { replace: true });
    } catch (error) {
      if (sessionRef.current.sessionId !== submittingSession.sessionId) return;
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
    if (submitInFlight.current) return;
    if (!window.confirm("Start a clean proposal? The server draft is kept.")) {
      return;
    }
    if (session.draftId) {
      const clean = repository.create();
      activateSession(clean, "intent");
      return;
    }
    const cleanDraft = structuredClone(DEFAULT_DRAFT);
    const {
      legacyRecovery: _legacyRecovery,
      resubmitsProposalId: _resubmitsProposalId,
      ...currentSession
    } = sessionRef.current;
    if (session.legacyRecovery) repository.clearLegacy();
    const clean = repository.save({
      ...currentSession,
      form: cleanDraft,
      presetId: "",
      templateId: "project",
      pathId: "project-formation",
      lastVisitedStep: "intent",
    });
    activateSession(clean, "intent");
  };

  const handleSaveAndExit = async () => {
    if (submitInFlight.current) return;
    const savingSessionId = sessionRef.current.sessionId;
    const draftId = await saveDraftNow();
    if (sessionRef.current.sessionId !== savingSessionId) return;
    navigate(
      draftId || sessionRef.current.draftId
        ? "/app/proposals/drafts"
        : "/app/proposals",
    );
  };

  const handleRecover = (nextSession: ProposalWizardSessionV2) => {
    if (submitInFlight.current) return;
    activateSession(nextSession);
  };

  const handleDiscardRecovery = (sessionId: string) => {
    if (submitInFlight.current) return;
    const discarded = repository.get(sessionId);
    repository.remove(sessionId);
    if (discarded?.legacyRecovery) repository.clearLegacy();
    setRecoverableSessions(repository.listRecoverable(session.sessionId));
  };

  const attemptedNext = wizardState.attemptedStepId === wizardState.stepId;
  const submitting = wizardState.submitStatus === "submitting";
  const summaryInitiative = selectedInitiative?.title ?? null;
  const wizardAnnouncement = attemptedNext
    ? `${currentStep.title}. Complete the highlighted required field before continuing.`
    : `${currentStep.title}. Step ${currentStepIndex + 1} of ${currentPath.steps.length}. ${currentStep.description}`;

  return (
    <div className="proposal-wizard">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {wizardAnnouncement}
      </p>
      <PageHint pageId="proposals" />
      <ProposalCreationLineageMessage
        resubmitsProposalId={draft.resubmitsProposalId}
      />
      <WizardHeader
        onSave={() => void saveDraftNow()}
        onSaveAndExit={() => void handleSaveAndExit()}
        onStartOver={handleStartOver}
        pathLabel={presetId ? currentPath.label : "Not chosen"}
        proposalSummary={draft.summary}
        proposalTitle={draft.title}
        saveStatus={wizardState.saveStatus}
        saving={wizardState.saveStatus === "syncing"}
        submitting={submitting}
      />
      <WizardRecovery
        sessions={recoverableSessions}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
        submitting={submitting}
      />
      <WizardProgress
        currentStepId={wizardState.stepId}
        path={currentPath}
        reachableStepIds={reachableSteps}
        onStepChange={(stepId) => send({ type: "STEP_REQUESTED", stepId })}
        submitting={submitting}
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
          description={currentStep.description}
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
              budgetValid={budgetValid}
              draft={draft}
              formationEligible={draft.formationEligible}
              setDraft={setDraft}
            />
          ) : null}

          {wizardState.stepId === "review" ? (
            <ReviewStep
              budgetTotal={budgetTotal}
              canAct={canAct}
              canSubmit={fullPathValid && !tierBlocked}
              draft={draft}
              formationEligible={draft.formationEligible}
              mode={templateKind}
              presetLabel={selectedPreset?.label}
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
            submitting={submitting}
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
