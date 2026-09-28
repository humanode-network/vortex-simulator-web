import { GlassySection } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { Select } from "@/components/primitives/select";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import type {
  ApplicationCommand,
  FormationApplicationPage,
} from "@/lib/api/formationApplications";

export type FormationApplicationDraft = { statement: string; role: string };

export function FormationApplicationForm({
  proposalId,
  eligible,
  busy,
  openRoles,
  limits,
  onCommand,
  value,
  onChange,
}: {
  proposalId: string;
  eligible: boolean;
  busy: boolean;
  openRoles: Array<{ title: string; desc: string }>;
  limits: FormationApplicationPage["limits"];
  onCommand: (input: ApplicationCommand) => Promise<void>;
  value: FormationApplicationDraft;
  onChange: (value: FormationApplicationDraft) => void;
}) {
  const { statement, role } = value;
  const roles = [
    ...new Map(openRoles.map((entry) => [entry.title, entry])).values(),
  ];
  const selectedRole = roles.find((entry) => entry.title === role);
  const canSubmit =
    eligible &&
    !busy &&
    Boolean(selectedRole) &&
    statement.trim().length >= limits.statementMin &&
    statement.trim().length <= limits.statementMax;
  return (
    <div id="formation-apply-form">
      <GlassySection title="Apply to join">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            onCommand({
              type: "formation.application.submit",
              payload: {
                proposalId,
                statement: statement.trim(),
                ...(role.trim() ? { role: role.trim() } : {}),
              },
            });
          }}
        >
          <fieldset disabled={busy || !eligible} className="min-w-0 space-y-4">
            <label className="block space-y-2 text-sm">
              <span>Role</span>
              <Select
                value={role}
                required
                onChange={(event) =>
                  onChange({ ...value, role: event.target.value })
                }
              >
                <option value="">Choose a role</option>
                {roles.map((entry) => (
                  <option key={entry.title} value={entry.title}>
                    {entry.title}
                  </option>
                ))}
              </Select>
            </label>
            {selectedRole && (
              <p className="text-sm [overflow-wrap:anywhere] text-muted">
                {selectedRole.desc}
              </p>
            )}
            {roles.length === 0 && (
              <p className="text-sm text-muted">No open roles are available.</p>
            )}
            <label htmlFor="formation-statement" className="block text-sm">
              How would you contribute?
            </label>
            <ProposalNarrativeEditor
              disabled={busy || !eligible}
              label="How would you contribute?"
              id="formation-statement"
              value={statement}
              onChange={(statement) => onChange({ ...value, statement })}
              documentLabel="application statement"
              placeholder="Relevant experience, availability, and planned contribution."
            />
            <p className="text-xs text-muted">
              {statement.trim().length} characters. Minimum{" "}
              {limits.statementMin}; maximum {limits.statementMax}.
            </p>
            <Button type="submit" disabled={!canSubmit}>
              {busy ? "Submitting..." : "Submit application"}
            </Button>
          </fieldset>
          {!eligible && (
            <p className="text-sm text-muted">
              An active Human Node is required to apply.
            </p>
          )}
        </form>
      </GlassySection>
    </div>
  );
}
