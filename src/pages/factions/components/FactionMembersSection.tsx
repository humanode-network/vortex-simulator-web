import { AddressInline } from "@/components/AddressInline";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Badge } from "@/components/primitives/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Select } from "@/components/primitives/select";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type FactionMember = NonNullable<FactionDto["memberships"]>[number];

type FactionMembersSectionProps = {
  canManageMembers: boolean;
  memberships: FactionMember[];
  mutating: boolean;
  onRoleSet: (address: string, role: "founder" | "steward" | "member") => void;
  viewerAddress: string | null;
};

export function FactionMembersSection({
  canManageMembers,
  memberships,
  mutating,
  onRoleSet,
  viewerAddress,
}: FactionMembersSectionProps) {
  const activeMemberships = memberships.filter(
    (membership) => membership.isActive,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeMemberships.length === 0 ? (
          <NoDataYetBar label="members" />
        ) : (
          activeMemberships.map((membership) => {
            const isSelf =
              viewerAddress !== null &&
              addressesReferToSameIdentity(viewerAddress, membership.address);

            return (
              <div
                key={membership.address}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <AddressInline
                    address={membership.address}
                    className="text-text"
                    textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
                  />
                  <p className="text-xs text-muted">
                    Joined {formatDateTime(membership.joinedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManageMembers ? (
                    <Select
                      value={membership.role}
                      disabled={mutating}
                      onChange={(event) =>
                        onRoleSet(
                          membership.address,
                          event.target.value as
                            | "founder"
                            | "steward"
                            | "member",
                        )
                      }
                    >
                      <option value="founder">Founder</option>
                      <option value="steward">Steward</option>
                      <option value="member">Member</option>
                    </Select>
                  ) : (
                    <Badge variant="outline">{membership.role}</Badge>
                  )}
                  {isSelf ? <Badge variant="outline">You</Badge> : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
