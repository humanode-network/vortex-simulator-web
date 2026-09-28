import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { AddressInline } from "@/components/AddressInline";
import { GlassySection } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import {
  apiFormationTeam,
  apiFormationTeamDeparture,
  type FormationTeamMember,
} from "@/lib/api/formationApplications";
import { formationApplicationError } from "@/lib/formationApplicationUi";
import { FormationConfirmation } from "./FormationConfirmation";

type Props = {
  proposalId: string;
  revision: number;
  onChanged: () => Promise<void>;
};
export function FormationTeamMembership(props: Props) {
  const auth = useAuth();
  if (!auth.authenticated || !auth.address) return null;
  return (
    <TeamMembershipWorkspace
      key={`${auth.address}:${props.proposalId}`}
      {...props}
    />
  );
}
function TeamMembershipWorkspace({ proposalId, revision, onChanged }: Props) {
  const auth = useAuth();
  const [members, setMembers] = useState<FormationTeamMember[]>([]);
  const [selected, setSelected] = useState<FormationTeamMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const flight = useRef(false);
  const generation = useRef(0);
  const receipts = useRef(new Map<string, string>());
  const reload = useCallback(async () => {
    const request = ++generation.current;
    try {
      const data = await apiFormationTeam(proposalId);
      if (request !== generation.current) return;
      setMembers(data.members);
      setError(null);
      setSelected((old) =>
        old && data.members.some((row) => row.membershipId === old.membershipId)
          ? old
          : null,
      );
    } catch (cause) {
      if (request === generation.current)
        setError(formationApplicationError(cause));
    }
  }, [proposalId]);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload, revision]);
  async function refresh() {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    try {
      await reload();
      await onChanged();
    } catch {
      setError("Could not refresh the project. Try again.");
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  async function depart() {
    if (!selected || flight.current || (selected.canRemove && !auth.eligible))
      return;
    flight.current = true;
    setBusy(true);
    generation.current++;
    setError(null);
    const key =
      receipts.current.get(selected.membershipId) ?? crypto.randomUUID();
    receipts.current.set(selected.membershipId, key);
    try {
      await apiFormationTeamDeparture(
        {
          proposalId,
          membershipId: selected.membershipId,
          memberAddress: selected.address,
          action: selected.canLeave ? "leave" : "remove",
        },
        key,
      );
      receipts.current.delete(selected.membershipId);
      setMembers((rows) =>
        rows.filter((row) => row.membershipId !== selected.membershipId),
      );
      setNotice(
        selected.canLeave
          ? "You left the team. Earned MM is retained."
          : "Member removed. Their earned MM is retained.",
      );
      setSelected(null);
      try {
        await onChanged();
      } catch {
        setError("Departure saved. Refresh to update the project.");
      }
    } catch (cause) {
      setError(formationApplicationError(cause));
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  const manageable = members.filter(
    (member) => member.canLeave || member.canRemove,
  );
  if (!manageable.length && !notice && !error) return null;
  return (
    <GlassySection
      title="Team participation"
      action={
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void refresh()}
        >
          Refresh team
        </Button>
      }
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <div className="space-y-3">
        {manageable.map((member) => (
          <div
            key={member.membershipId}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0 text-sm [overflow-wrap:anywhere]">
              <AddressInline address={member.address} />
              {member.role && <p className="text-muted">{member.role}</p>}
            </div>
            <Button
              variant="outline"
              disabled={busy || (member.canRemove && !auth.eligible)}
              onClick={() => setSelected(member)}
            >
              {member.canLeave ? "Leave team" : "Remove member"}
            </Button>
          </div>
        ))}
      </div>
      {selected && (
        <FormationConfirmation
          label="Confirm team departure"
          confirmLabel={selected.canLeave ? "Confirm leave" : "Confirm removal"}
          busy={busy}
          disabled={selected.canRemove && !auth.eligible}
          onConfirm={() => void depart()}
          onCancel={() => setSelected(null)}
        >
          {selected.canLeave
            ? "Leave this project team?"
            : "Remove this member from the project team?"}{" "}
          Earned MM and completed participation remain recorded. Rejoining
          requires a new approved application.
        </FormationConfirmation>
      )}
    </GlassySection>
  );
}
