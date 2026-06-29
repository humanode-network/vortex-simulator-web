import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PageHint } from "@/components/PageHint";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { useAuth } from "@/app/auth/AuthContext";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import { initiativeOptionsWithSelection } from "@/lib/initiativeUi";
import { toTimestampMs } from "@/lib/dateTime";
import {
  apiProposalDraftDelete,
  apiProposalDraftSave,
  apiProposalSubmitToPool,
} from "@/lib/apiClient";
import { ProposalCreationLineageMessage } from "./proposalCreation/ProposalCreationMessages";
import { ProposalCreationStepCard } from "./proposalCreation/ProposalCreationStepCard";
import { ProposalCreationToolbar } from "./proposalCreation/ProposalCreationToolbar";
import {
  clearDraftStorage,
  loadDraft,
  loadServerDraftId,
  loadStep,
  persistDraft,
  persistServerDraftId,
  persistStep,
  persistTemplateId,
} from "./proposalCreation/storage";
import { draftToApiForm } from "./proposalCreation/toApiForm";
import {
  DEFAULT_DRAFT,
  isStepKey,
  type ProposalDraftForm,
  type StepKey,
} from "./proposalCreation/types";
import {
  DEFAULT_PRESET_ID,
  PROPOSAL_PRESETS,
} from "./proposalCreation/presets/registry";
import {
  useProposalDraftHydration,
  type ProposalDraftHydrationResult,
} from "./proposalCreation/useProposalDraftHydration";
import { useProposalCreationComputed } from "./proposalCreation/useProposalCreationComputed";
import { useProposalCreationPreset } from "./proposalCreation/useProposalCreationPreset";
import { useProposalCreationReferenceData } from "./proposalCreation/useProposalCreationReferenceData";

const ProposalCreation: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ProposalDraftForm>(() => loadDraft());
  const {
    presetId,
    setPresetId,
    setTemplateKind,
    skipNextApply: skipNextPresetApply,
    templateKind,
  } = useProposalCreationPreset(setDraft);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [serverDraftId, setServerDraftId] = useState<string | null>(() =>
    loadServerDraftId(),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const requestedDraftId = (searchParams.get("draftId") ?? "").trim();
  const requestedResubmitsProposalId = (
    searchParams.get("resubmitsProposalId") ?? ""
  ).trim();
  const handleDraftLoaded = useCallback(
    ({
      draft: nextDraft,
      draftId,
      presetId: nextPresetId,
      templateKind: nextTemplateKind,
    }: ProposalDraftHydrationResult) => {
      skipNextPresetApply();
      setTemplateKind(nextTemplateKind);
      setPresetId(nextPresetId);
      setDraft(nextDraft);
      setServerDraftId(draftId);
      setSavedAt(Date.now());
      setSaveError(null);
      setSubmitError(null);
    },
    [setPresetId, setTemplateKind, skipNextPresetApply],
  );
  const { loadDraftError, loadingDraftId } = useProposalDraftHydration({
    navigate,
    onDraftLoaded: handleDraftLoaded,
    requestedDraftId,
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      persistDraft(draft);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [draft]);

  const stepParam = (searchParams.get("step") ?? "").trim();
  const desiredStep: StepKey =
    stepParam === "review"
      ? "review"
      : isStepKey(stepParam)
        ? stepParam
        : loadStep();

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
  useEffect(() => {
    persistTemplateId(template.id);
  }, [template.id]);

  const step: StepKey = desiredStep;

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

  useEffect(() => {
    if (requestedDraftId) return;
    setDraft((prev) => {
      const nextLineage = requestedResubmitsProposalId || undefined;
      if (prev.resubmitsProposalId === nextLineage) return prev;
      return {
        ...prev,
        resubmitsProposalId: nextLineage,
      };
    });
  }, [requestedDraftId, requestedResubmitsProposalId]);

  useEffect(() => {
    if (searchParams.get("step") === step) return;
    const next = new URLSearchParams(searchParams);
    next.set("step", step);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, step]);

  useEffect(() => {
    persistStep(step);
  }, [step]);

  const textareaClassName =
    "w-full rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition supports-[backdrop-filter]:backdrop-blur-md hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

  const goToStep = (next: StepKey) => {
    persistDraft(draft);
    persistStep(next);
    setAttemptedNext(false);
    const params = new URLSearchParams(searchParams);
    params.set("step", next);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onNext = () => {
    setAttemptedNext(true);
    const next = template.getNextStep(step, guardedComputed);
    if (next) return goToStep(next);
  };

  const onBack = () => {
    persistDraft(draft);
    setAttemptedNext(false);
    const prev = template.getPrevStep(step);
    if (prev) return goToStep(prev);
    navigate("/app/proposals");
  };

  useEffect(() => {
    if (template.stepOrder.includes(step)) return;
    const fallback = template.stepOrder[0] ?? "essentials";
    const params = new URLSearchParams(searchParams);
    params.set("step", fallback);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, step, template.id, template.stepOrder]);

  useEffect(() => {
    if (!tierBlocked || step === "essentials") return;
    const params = new URLSearchParams(searchParams);
    params.set("step", "essentials");
    setSearchParams(params, { replace: true });
    setAttemptedNext(true);
  }, [searchParams, setSearchParams, step, tierBlocked]);

  const resetDraft = () => {
    clearDraftStorage();
    setDraft(DEFAULT_DRAFT);
    setPresetId(DEFAULT_PRESET_ID);
    setTemplateKind("project");
    setAttemptedNext(false);
    setSavedAt(null);
    setSaveError(null);
    setSubmitError(null);
    const idToDelete = serverDraftId;
    setServerDraftId(null);
    const params = new URLSearchParams(searchParams);
    params.set("step", "essentials");
    params.delete("draftId");
    setSearchParams(params, { replace: true });

    if (
      idToDelete &&
      (!SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible))
    ) {
      void apiProposalDraftDelete({ draftId: idToDelete }).catch(() => null);
    }
  };

  const saveDraftNow = async () => {
    persistDraft(draft);
    persistStep(step);
    setSavedAt(Date.now());
    setSaveError(null);

    const canWrite = !SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible);
    if (!canWrite) {
      setSaveError("Saved locally. Connect and verify to sync drafts.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiProposalDraftSave({
        ...(serverDraftId ? { draftId: serverDraftId } : {}),
        form: draftToApiForm(draft, { templateId: template.id }),
      });
      setServerDraftId(res.draftId);
      persistServerDraftId(res.draftId);
      setSavedAt(toTimestampMs(res.updatedAt, Date.now()));
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canAct = !SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible);
  const submitDisabled = !guardedComputed.canSubmit || !canAct || tierBlocked;

  const submitProposal = async () => {
    if (!canAct || tierBlocked || submitting) return;
    setSubmitError(null);
    setSaving(false);
    setSaveError(null);
    setSubmitting(true);
    try {
      let draftId = serverDraftId;
      if (!draftId) {
        const saved = await apiProposalDraftSave({
          form: draftToApiForm(draft, {
            templateId: template.id,
          }),
        });
        draftId = saved.draftId;
        setServerDraftId(draftId);
        persistServerDraftId(draftId);
      } else {
        await apiProposalDraftSave({
          draftId,
          form: draftToApiForm(draft, {
            templateId: template.id,
          }),
        });
      }
      const res = await apiProposalSubmitToPool({ draftId });
      clearDraftStorage();
      navigate(`/app/proposals/${res.proposalId}/pp`);
    } catch (error) {
      setSubmitError(formatProposalSubmitError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <ProposalCreationLineageMessage
        resubmitsProposalId={draft.resubmitsProposalId}
      />
      <ProposalCreationToolbar
        onBackToProposalsHref="/app/proposals"
        onResetDraft={resetDraft}
        onSaveDraft={() => void saveDraftNow()}
        onStepChange={goToStep}
        savedAt={savedAt}
        saving={saving}
        serverDraftId={serverDraftId}
        step={step}
        submitting={submitting}
        template={template}
        tierBlocked={tierBlocked}
      />

      <ProposalCreationStepCard
        attemptedNext={attemptedNext}
        budgetTotal={budgetTotal}
        canAct={canAct}
        chamberOptions={chamberOptions}
        computed={computed}
        currentTier={currentTier}
        draft={draft}
        guardedComputed={guardedComputed}
        initiativeOptions={visibleInitiativeOptions}
        loadDraftError={loadDraftError}
        loadingDraftId={loadingDraftId}
        onBack={onBack}
        onNext={onNext}
        onPresetChange={setPresetId}
        onSubmit={() => void submitProposal()}
        onTemplateChange={(next) => {
          setTemplateKind(next);
          if (presetId !== "") setPresetId("");
        }}
        presetId={presetId}
        presets={PROPOSAL_PRESETS}
        proposerAddress={auth.address ?? null}
        requiredTier={requiredTier}
        saveError={saveError}
        selectedChamber={selectedChamber}
        selectedInitiative={selectedInitiative}
        setDraft={setDraft}
        step={step}
        submitDisabled={submitDisabled}
        submitError={submitError}
        submitting={submitting}
        template={template}
        templateKind={templateKind}
        textareaClassName={textareaClassName}
        tierBlocked={tierBlocked}
        tierEligible={tierEligible}
      />
    </div>
  );
};

export default ProposalCreation;
