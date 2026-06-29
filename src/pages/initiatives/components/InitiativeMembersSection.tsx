import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { GlassySection, GlassyStatusChip } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { apiInitiativeMemberRoleSet } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import { initiativeRoleLabel } from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import type { InitiativeMembershipDto, InitiativeRoleDto } from "@/types/api";

type InitiativeMembersSectionProps = {
  canAdmin: boolean;
  initiativeId: string;
  memberships: InitiativeMembershipDto[];
  onChanged: () => Promise<void> | void;
};

export function InitiativeMembersSection({
  canAdmin,
  initiativeId,
  memberships,
  onChanged,
}: InitiativeMembersSectionProps) {
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<InitiativeRoleDto>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setMemberRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetAddress = address.trim();
    if (!targetAddress) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiInitiativeMemberRoleSet({
        initiativeId,
        address: targetAddress,
        role,
      });
      setAddress("");
      setRole("member");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassySection title="Members">
      {canAdmin ? (
        <form
          className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_auto]"
          onSubmit={setMemberRole}
        >
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Human Node address"
            aria-label="Initiative member address"
          />
          <Select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as InitiativeRoleDto)
            }
            aria-label="Initiative member role"
          >
            {Object.entries(initiativeRoleLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !address.trim()}
          >
            Set role
          </Button>
          {error ? (
            <p className="text-sm text-destructive md:col-span-3">{error}</p>
          ) : null}
        </form>
      ) : null}

      {memberships.length === 0 ? (
        <NoDataYetBar label="initiative members" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {memberships.map((membership) => (
            <article
              key={membership.address}
              className="rounded-2xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] p-4 shadow-[var(--shadow-tile)]"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/app/human-nodes/${membership.address}`}
                  className="min-w-0 text-sm font-semibold text-text underline-offset-4 hover:underline"
                >
                  {shortAddress(membership.address, 6)}
                </Link>
                <GlassyStatusChip tone={membership.isActive ? "ok" : "neutral"}>
                  {initiativeRoleLabel[membership.role]}
                </GlassyStatusChip>
              </div>
              <p className="mt-2 text-xs text-muted">
                Joined {formatDateTime(membership.joinedAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </GlassySection>
  );
}
