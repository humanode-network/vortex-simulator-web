import { AddressInline } from "@/components/AddressInline";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type CofounderInvitation = NonNullable<
  FactionDto["cofounderInvitations"]
>[number];
type JoinRequest = NonNullable<FactionDto["joinRequests"]>[number];

type FactionModerationQueuesProps = {
  canModerateQueues: boolean;
  cofounderInvitations: CofounderInvitation[];
  isFounderAdmin: boolean;
  joinRequests: JoinRequest[];
  mutating: boolean;
  onApproveJoinRequest: (address: string) => void;
  onCancelCofounderInvite: (address: string) => void;
  onDeclineJoinRequest: (address: string) => void;
};

export function FactionModerationQueues({
  canModerateQueues,
  cofounderInvitations,
  isFounderAdmin,
  joinRequests,
  mutating,
  onApproveJoinRequest,
  onCancelCofounderInvite,
  onDeclineJoinRequest,
}: FactionModerationQueuesProps) {
  if (!canModerateQueues) {
    return null;
  }

  const pendingJoinRequests = joinRequests.filter(
    (request) => request.status === "pending",
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Cofounder invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cofounderInvitations.length === 0 ? (
            <NoDataYetBar label="cofounder invitations" />
          ) : (
            cofounderInvitations.map((invite) => (
              <div
                key={`${invite.address}-${invite.invitedAt}`}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <AddressInline
                    address={invite.address}
                    className="text-text"
                    textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
                  />
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
                    <span>Invited by</span>
                    <AddressInline address={invite.invitedBy} />
                    <span>· {formatDateTime(invite.invitedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invite.status}</Badge>
                  {isFounderAdmin && invite.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutating}
                      onClick={() => onCancelCofounderInvite(invite.address)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Join requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingJoinRequests.length === 0 ? (
            <NoDataYetBar label="join requests" />
          ) : (
            pendingJoinRequests.map((request) => (
              <div
                key={`${request.address}-${request.requestedAt}`}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <AddressInline
                    address={request.address}
                    className="text-text"
                    textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
                  />
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
                    <span>Requested</span>
                    <span>{formatDateTime(request.requestedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={mutating}
                    onClick={() => onApproveJoinRequest(request.address)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutating}
                    onClick={() => onDeclineJoinRequest(request.address)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
