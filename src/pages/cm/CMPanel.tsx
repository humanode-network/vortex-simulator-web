import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  apiChambers,
  apiChamberMultiplierSubmit,
  apiMyGovernance,
} from "@/lib/apiClient";
import type { ChamberDto } from "@/types/api";

const CMPanel: React.FC = () => {
  const [chambers, setChambers] = useState<Array<
    Pick<ChamberDto, "id" | "name" | "multiplier"> & {
      current: number;
      suggested: number;
      suggestedInput: string;
      member: boolean;
      submissions: number;
    }
  > | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [chambersRes, governanceRes] = await Promise.allSettled([
          apiChambers(),
          apiMyGovernance(),
        ]);
        if (!active) return;
        if (chambersRes.status !== "fulfilled") {
          setChambers([]);
          setLoadError(
            chambersRes.reason?.message ?? "Failed to load chamber multipliers",
          );
          return;
        }
        const myChamberIds =
          governanceRes.status === "fulfilled"
            ? governanceRes.value.myChamberIds
            : [];
        const items = chambersRes.value.items;
        setChambers(
          items.map((chamber) => ({
            id: chamber.id,
            name: chamber.name,
            multiplier: chamber.multiplier,
            current: chamber.multiplier,
            suggested: chamber.multiplier,
            suggestedInput: String(chamber.multiplier),
            member: myChamberIds.includes(chamber.id),
            submissions: 0,
          })),
        );
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setChambers([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateSuggestionInput = (id: string, value: string) => {
    setChambers((prev) =>
      prev
        ? prev.map((c) => {
            if (c.id !== id) return c;
            const trimmed = value.trim();
            const parsed = Number(trimmed);
            return {
              ...c,
              suggestedInput: value,
              suggested: Number.isFinite(parsed) ? parsed : c.suggested,
            };
          })
        : prev,
    );
  };

  const handleSubmit = async (chamberId: string) => {
    if (!chambers) return;
    const target = chambers.find((chamber) => chamber.id === chamberId);
    if (!target) return;
    if (target.member) return;
    const parsedSuggested = Number(target.suggestedInput.trim());
    if (!Number.isFinite(parsedSuggested)) {
      setSubmitError("Enter a valid numeric multiplier (e.g. 1.0).");
      return;
    }
    setSubmittingId(chamberId);
    setSubmitError(null);
    try {
      const result = await apiChamberMultiplierSubmit({
        chamberId,
        multiplierTimes10: Math.round(parsedSuggested * 10),
      });
      setChambers((prev) =>
        prev
          ? prev.map((chamber) => {
              if (chamber.id !== chamberId) return chamber;
              const nextTimes10 =
                result.applied?.nextMultiplierTimes10 ??
                result.aggregate.avgTimes10 ??
                Math.round(chamber.suggested * 10);
              return {
                ...chamber,
                current: nextTimes10 / 10,
                suggested: nextTimes10 / 10,
                suggestedInput: String(nextTimes10 / 10),
                submissions: result.aggregate.submissions,
              };
            })
          : prev,
      );
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  const nonMemberSuggestions = (chambers ?? []).filter((c) => !c.member);
  const handleSubmitAll = async () => {
    if (!chambers || nonMemberSuggestions.length === 0) return;
    setSubmittingAll(true);
    for (const chamber of nonMemberSuggestions) {
      await handleSubmit(chamber.id);
    }
    setSubmittingAll(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="cm-panel" />
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          CM panel unavailable: {loadError}
        </Card>
      ) : null}
      {chambers === null && !loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading chambers…
        </Card>
      ) : null}
      {chambers !== null && chambers.length === 0 && !loadError ? (
        <NoDataYetBar label="chambers" />
      ) : null}
      {submitError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          CM submission failed: {submitError}
        </Card>
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Set your <HintLabel termId="cognitocratic_measure">CM</HintLabel>{" "}
          multipliers for chambers you are not a member of. Chambers you belong
          to are blurred and not adjustable here. If you submit a new number for
          the same chamber later, it replaces your previous submission.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(chambers ?? []).map((chamber) => (
            <Surface
              key={chamber.id}
              variant="panelAlt"
              className={`relative px-4 py-3 ${chamber.member ? "opacity-50" : ""}`}
            >
              {chamber.member && (
                <div className="absolute inset-0 rounded-2xl bg-panel-alt/60 backdrop-blur-sm" />
              )}
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text">
                    {chamber.name}
                  </p>
                  <Badge variant="outline">M × {chamber.current}</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted">
                  <p>Your suggestion</p>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3"
                    disabled={chamber.member}
                    value={chamber.suggestedInput}
                    onChange={(e) =>
                      updateSuggestionInput(chamber.id, e.target.value)
                    }
                    onBlur={() => {
                      if (chamber.suggestedInput.trim().length > 0) return;
                      updateSuggestionInput(
                        chamber.id,
                        String(chamber.current),
                      );
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{chamber.submissions} submissions</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={chamber.member || submittingId === chamber.id}
                    onClick={() => handleSubmit(chamber.id)}
                  >
                    {submittingId === chamber.id ? "Submitting…" : "Submit"}
                  </Button>
                </div>
                {chamber.member && (
                  <p className="text-xs text-muted">
                    You cannot set M for chambers you belong to.
                  </p>
                )}
              </div>
            </Surface>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={nonMemberSuggestions.length === 0 || submittingAll}
          onClick={handleSubmitAll}
        >
          {submittingAll ? "Submitting…" : "Submit suggestions"}
        </Button>
      </div>
    </div>
  );
};

export default CMPanel;
