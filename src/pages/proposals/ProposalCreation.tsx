import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Tabs } from "@/components/primitives/tabs";
import { PageHint } from "@/components/PageHint";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { useAuth } from "@/app/auth/AuthContext";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import { formatTime } from "@/lib/dateTime";
import {
  requiredTierForProposalType,
  isTierEligible,
} from "@/lib/proposalTypes";
import { TierLabel } from "@/components/TierLabel";
import {
  apiChambers,
  apiMyGovernance,
  apiProposalDraft,
  apiProposalDraftDelete,
  apiProposalDraftSave,
  apiProposalSubmitToPool,
} from "@/lib/apiClient";
import type { ChamberDto, TierProgressDto } from "@/types/api";
import { BudgetStep } from "./proposalCreation/steps/BudgetStep";
import { EssentialsStep } from "./proposalCreation/steps/EssentialsStep";
import { PlanStep } from "./proposalCreation/steps/PlanStep";
import { ReviewStep } from "./proposalCreation/steps/ReviewStep";
import {
  clearDraftStorage,
  loadDraft,
  normalizeDraft,
  loadPresetId,
  loadServerDraftId,
  loadStep,
  loadTemplateId,
  persistDraft,
  persistPresetId,
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
import { getWizardTemplate } from "./proposalCreation/templates/registry";
import type {
  WizardComputed,
  WizardTemplate,
} from "./proposalCreation/templates/types";
import {
  DEFAULT_PRESET_ID,
  PROPOSAL_PRESETS,
  applyPresetToDraft,
  getProposalPreset,
  inferPresetIdFromDraft,
} from "./proposalCreation/presets/registry";

const ProposalCreation: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ProposalDraftForm>(() => loadDraft());
  const presetInitialized = useRef(false);
  const skipNextPresetApply = useRef(false);
  const [presetId, setPresetId] = useState<string>(() => {
    const storedDraft = loadDraft();
    const inferred = inferPresetIdFromDraft(storedDraft);
    const storedPreset = loadPresetId();
    if (storedPreset) {
      const knownStoredPreset = PROPOSAL_PRESETS.find(
        (preset) => preset.id === storedPreset,
      );
      const inferredPreset = getProposalPreset(inferred);
      if (
        knownStoredPreset &&
        knownStoredPreset.templateId === inferredPreset.templateId
      ) {
        return storedPreset;
      }
    }
    return inferred;
  });
  const [templateKind, setTemplateKind] = useState<"project" | "system">(() => {
    const storedTemplateId = loadTemplateId();
    if (storedTemplateId === "project" || storedTemplateId === "system") {
      return storedTemplateId;
    }
    const preset = PROPOSAL_PRESETS.find((item) => item.id === presetId);
    return preset?.templateId ?? "project";
  });
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [serverDraftId, setServerDraftId] = useState<string | null>(() =>
    loadServerDraftId(),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);
  const [loadDraftError, setLoadDraftError] = useState<string | null>(null);
  const [chambers, setChambers] = useState<ChamberDto[]>([]);
  const [tierProgress, setTierProgress] = useState<TierProgressDto | null>(
    null,
  );
  const requestedDraftId = (searchParams.get("draftId") ?? "").trim();

  useEffect(() => {
    const preset = PROPOSAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      persistPresetId("");
      return;
    }
    if (skipNextPresetApply.current) {
      skipNextPresetApply.current = false;
      persistPresetId(preset.id);
      return;
    }
    if (preset.templateId !== templateKind) {
      persistPresetId("");
      setPresetId("");
      return;
    }
    setDraft((prev) => {
      const shouldSoftApply = !presetInitialized.current;
      presetInitialized.current = true;
      if (shouldSoftApply) {
        const seeded = { ...prev, presetId: preset.id };
        if (preset.templateId === "system") {
          return {
            ...seeded,
            chamberId: "general",
            metaGovernance: seeded.metaGovernance ?? preset.metaGovernance,
          };
        }
        return seeded;
      }

      let next = applyPresetToDraft(prev, preset);
      if (preset.templateId === "system") {
        next = { ...next, chamberId: "general" };
      }
      return next;
    });
    persistPresetId(preset.id);
  }, [presetId, templateKind]);

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

  const budgetTotal = useMemo(() => {
    if (draft.formationEligible !== false) {
      return draft.timeline.reduce((sum, item) => {
        const n = Number(item.budgetHmnd);
        if (!Number.isFinite(n) || n <= 0) return sum;
        return sum + n;
      }, 0);
    }
    return draft.budgetItems.reduce((sum, item) => {
      const n = Number(item.amount);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);
  }, [draft.formationEligible, draft.timeline, draft.budgetItems]);

  const baseTemplate = useMemo<WizardTemplate>(
    () => getWizardTemplate(templateKind),
    [templateKind],
  );
  const template = useMemo<WizardTemplate>(() => {
    if (baseTemplate.id !== "project" || draft.formationEligible !== false) {
      return baseTemplate;
    }
    return {
      ...baseTemplate,
      stepOrder: ["essentials", "plan", "review"],
      stepTabLabels: {
        ...baseTemplate.stepTabLabels,
        essentials: "1 · Essentials",
        plan: "2 · Plan",
        review: "3 · Review",
      },
      getNextStep(step: StepKey, computed: WizardComputed) {
        if (step === "essentials")
          return computed.essentialsValid ? "plan" : null;
        if (step === "plan") return computed.planValid ? "review" : null;
        return null;
      },
      getPrevStep(step: StepKey) {
        if (step === "review") return "plan";
        if (step === "plan") return "essentials";
        return null;
      },
    };
  }, [baseTemplate, draft.formationEligible]);
  useEffect(() => {
    persistTemplateId(template.id);
  }, [template.id]);

  const computed = useMemo(() => {
    return template.compute(draft, { budgetTotal });
  }, [draft, budgetTotal, template]);

  const requiredTier = requiredTierForProposalType(draft.proposalType);
  const currentTier = tierProgress?.tier ?? null;
  const tierEligible =
    currentTier && isTierEligible(currentTier, requiredTier) ? true : false;
  const tierBlocked = Boolean(currentTier) && !tierEligible;
  const guardedComputed = useMemo(
    () => ({
      ...computed,
      essentialsValid: computed.essentialsValid && !tierBlocked,
      canSubmit: computed.canSubmit && !tierBlocked,
    }),
    [computed, tierBlocked],
  );

  const step: StepKey = desiredStep;

  const chamberOptions = useMemo(() => {
    return [...chambers]
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((chamber) => ({ value: chamber.id, label: chamber.name }));
  }, [chambers]);

  const selectedChamber = useMemo(() => {
    return chambers.find((c) => c.id === draft.chamberId) ?? null;
  }, [chambers, draft.chamberId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiChambers();
        if (!active) return;
        setChambers(res.items);
      } catch {
        if (!active) return;
        setChambers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!requestedDraftId) {
      setLoadingDraftId(null);
      setLoadDraftError(null);
      return;
    }
    let active = true;
    setLoadingDraftId(requestedDraftId);
    setLoadDraftError(null);
    (async () => {
      try {
        const detail = await apiProposalDraft(requestedDraftId);
        if (!active) return;
        if (!detail.editableForm) {
          throw new Error("Draft payload unavailable for editing.");
        }

        const normalized = normalizeDraft(detail.editableForm);
        const nextTemplateKind =
          detail.editableForm.templateId ??
          (detail.editableForm.metaGovernance ? "system" : "project");
        const nextPresetId =
          detail.editableForm.presetId ?? inferPresetIdFromDraft(normalized);
        const nextDraftId = detail.id ?? requestedDraftId;

        skipNextPresetApply.current = true;
        setTemplateKind(nextTemplateKind);
        setPresetId(nextPresetId);
        setDraft(normalized);
        setServerDraftId(nextDraftId);
        setSavedAt(Date.now());
        setSaveError(null);
        setSubmitError(null);
        persistTemplateId(nextTemplateKind);
        persistPresetId(nextPresetId);
        persistDraft(normalized);
        persistServerDraftId(nextDraftId);
      } catch (error) {
        if (!active) return;
        setLoadDraftError((error as Error).message);
      } finally {
        if (!active) return;
        setLoadingDraftId(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [requestedDraftId]);

  useEffect(() => {
    if (!auth.enabled || !auth.authenticated) {
      setTierProgress(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setTierProgress(res.tier ?? null);
      } catch {
        if (!active) return;
        setTierProgress(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth.authenticated, auth.enabled]);

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
    "w-full rounded-xl border border-border bg-panel-alt px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition " +
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
      setSavedAt(Date.parse(res.updatedAt) || Date.now());
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canAct = !SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible);
  const submitDisabled = !guardedComputed.canSubmit || !canAct || tierBlocked;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/proposals">Back to proposals</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveDraftNow}
            disabled={saving || submitting}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetDraft}>
            Reset draft
          </Button>
          {savedAt ? (
            <span className="text-xs text-muted">
              Saved {formatTime(savedAt)}
            </span>
          ) : null}
          {serverDraftId ? (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/app/proposals/drafts/${serverDraftId}`}>
                View draft
              </Link>
            </Button>
          ) : null}
        </div>

        <Tabs
          value={step}
          onValueChange={(value) => {
            if (!isStepKey(value) && value !== "review") return;
            if (tierBlocked && value !== "essentials") return;
            goToStep(value as StepKey);
          }}
          options={template.stepOrder.map((key) => ({
            value: key,
            label: template.stepTabLabels[key],
          }))}
          className="w-full max-w-xl justify-between"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-text">
            Create proposal · {template.stepTitles[step]}
          </CardTitle>
          <p className="text-sm text-muted">
            Changes autosave locally. Eligible human nodes can save drafts to
            the simulation backend (see Drafts).
          </p>
        </CardHeader>

        <CardContent className="space-y-5 text-sm text-text">
          {saveError ? (
            <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-muted">
              {saveError}
            </div>
          ) : null}
          {loadingDraftId ? (
            <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-muted">
              Loading draft for editing…
            </div>
          ) : null}
          {loadDraftError ? (
            <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
              Draft load failed: {loadDraftError}
            </div>
          ) : null}
          {submitError ? (
            <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
              Submit failed: {submitError}
            </div>
          ) : null}
          {tierBlocked ? (
            <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
              Selected proposal type requires <TierLabel tier={requiredTier} />
              . Your tier is <TierLabel tier={currentTier ?? "Nominee"} />.
              Choose an eligible type to continue.
            </div>
          ) : null}

          {step === "essentials" ? (
            <EssentialsStep
              attemptedNext={attemptedNext}
              chamberOptions={chamberOptions}
              draft={draft}
              setDraft={setDraft}
              templateId={templateKind}
              onTemplateChange={(next) => {
                setTemplateKind(next);
                if (presetId !== "") setPresetId("");
              }}
              presetId={presetId}
              presets={PROPOSAL_PRESETS}
              onPresetChange={(nextPresetId) => {
                setPresetId(nextPresetId);
              }}
              textareaClassName={textareaClassName}
              requiredTier={requiredTier}
              currentTier={currentTier}
              tierEligible={tierEligible}
            />
          ) : null}

          {step === "plan" ? (
            <PlanStep
              attemptedNext={attemptedNext}
              draft={draft}
              setDraft={setDraft}
              formationEligible={draft.formationEligible}
              mode={template.id}
              textareaClassName={textareaClassName}
            />
          ) : null}

          {step === "budget" ? (
            <BudgetStep
              attemptedNext={attemptedNext}
              budgetTotal={budgetTotal}
              budgetValid={computed.budgetValid}
              draft={draft}
              formationEligible={draft.formationEligible}
              setDraft={setDraft}
            />
          ) : null}

          {step === "review" ? (
            <ReviewStep
              budgetTotal={budgetTotal}
              canAct={canAct}
              canSubmit={guardedComputed.canSubmit}
              draft={draft}
              formationEligible={draft.formationEligible}
              mode={template.id}
              selectedChamber={selectedChamber}
              setDraft={setDraft}
              textareaClassName={textareaClassName}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={onBack} disabled={submitting}>
              {step === "essentials" ? "Cancel" : "Back"}
            </Button>
            <div className="flex items-center gap-2">
              {step === "review" ? (
                <Button
                  disabled={submitDisabled || submitting}
                  title={
                    tierBlocked
                      ? `Not eligible for this proposal type. Required tier: ${requiredTier}.`
                      : SIM_AUTH_ENABLED && !canAct
                        ? "Connect and verify as an eligible human node to submit."
                        : undefined
                  }
                  onClick={async () => {
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
                  }}
                >
                  {submitting ? "Submitting…" : "Submit proposal"}
                </Button>
              ) : (
                <Button onClick={onNext}>Next</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalCreation;
