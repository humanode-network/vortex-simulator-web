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
  team?: {
    slots: string;
    locked: Array<{
      name: string;
      role: string;
      address?: string;
      membershipId?: string;
      inferredRole?: boolean;
    }>;
    open: Array<{ title: string; desc: string }>;
  };
};
export function FormationTeamMembership(props: Props) {
  const auth = useAuth();
  return (
    <TeamMembershipWorkspace
      key={`${auth.address ?? "public"}:${props.proposalId}`}
      {...props}
    />
  );
}
function TeamMembershipWorkspace({
  proposalId,
  revision,
  onChanged,
  team,
}: Props) {
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
    if (!auth.authenticated || !auth.address) return;
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
  }, [proposalId, auth.authenticated, auth.address]);
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
  const visibleMembers = team
    ? [
        ...team.locked.map((member) => ({
          key: member.membershipId ?? member.address ?? member.name,
          address: member.address,
          name: member.name,
          role: member.role,
          inferredRole: member.inferredRole,
          control: members.find(
            (row) =>
              (member.membershipId &&
                row.membershipId === member.membershipId) ||
              (member.address && row.address === member.address),
          ),
        })),
        ...members
          .filter(
            (member) =>
              !team.locked.some(
                (row) =>
                  row.membershipId === member.membershipId ||
                  row.address === member.address,
              ),
          )
          .map((member) => ({
            key: member.membershipId,
            address: member.address,
            name: member.address,
            role: member.role ?? "Contributor",
            inferredRole: false,
            control: member,
          })),
      ]
    : members
        .filter((member) => member.canLeave || member.canRemove)
        .map((member) => ({
          key: member.membershipId,
          address: member.address,
          name: member.address,
          role: member.role ?? "Contributor",
          inferredRole: false,
          control: member,
        }));
  if (!team && !visibleMembers.length && !notice && !error) return null;
  return (
    <GlassySection
      title="Team"
      action={
        auth.authenticated ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void refresh()}
          >
            Refresh team
          </Button>
        ) : undefined
      }
    >
      {team && (
        <p className="text-sm text-muted">{team.slots} team slots filled</p>
      )}
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
      <div className="divide-y divide-border/60">
        {visibleMembers.map((member) => (
          <div
            key={member.key}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 text-sm [overflow-wrap:anywhere]">
              {member.address ? (
                <AddressInline address={member.address} />
              ) : (
                <span>{member.name}</span>
              )}
              <p className="text-muted">
                {member.role}
                {member.inferredRole && " (inferred from original slot order)"}
              </p>
            </div>
            {member.control &&
              (member.control.canLeave || member.control.canRemove) && (
                <Button
                  variant="outline"
                  disabled={
                    busy || (member.control.canRemove && !auth.eligible)
                  }
                  onClick={() => setSelected(member.control ?? null)}
                >
                  {member.control.canLeave ? "Leave team" : "Remove member"}
                </Button>
              )}
          </div>
        ))}
        {visibleMembers.length === 0 && (
          <p className="py-3 text-sm text-muted">No team members yet.</p>
        )}
      </div>
      {team && (
        <div className="border-t border-border/60 pt-3">
          <h3 className="text-sm font-semibold">Open positions</h3>
          {team.open.length ? (
            <ul className="mt-2 divide-y divide-border/60">
              {team.open.map((slot, index) => (
                <li key={`${slot.title}:${index}`} className="py-2 text-sm">
                  <p className="font-medium">{slot.title}</p>
                  {slot.desc && <p className="text-muted">{slot.desc}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No open positions.</p>
          )}
        </div>
      )}
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
