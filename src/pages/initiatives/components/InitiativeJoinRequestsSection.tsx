import { AddressInline } from "@/components/AddressInline";
import { GlassySection } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { formatDateTime } from "@/lib/dateTime";
import type { InitiativeJoinRequestDto } from "@/types/api";

type InitiativeJoinRequestsSectionProps = {
  canModerate: boolean;
  joinRequests: InitiativeJoinRequestDto[];
  mutating: boolean;
  onApprove: (address: string) => void;
  onDecline: (address: string) => void;
};

export function InitiativeJoinRequestsSection({
  canModerate,
  joinRequests,
  mutating,
  onApprove,
  onDecline,
}: InitiativeJoinRequestsSectionProps) {
  const pending = joinRequests.filter(
    (request) => request.status === "pending",
  );
  if (!canModerate || pending.length === 0) return null;

  return (
    <GlassySection title="Join requests">
      <div className="grid gap-3">
        {pending.map((request) => (
          <article
            key={`${request.address}-${request.requestedAt}`}
            className="flex flex-col gap-3 rounded-md border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <AddressInline
                address={request.address}
                className="text-text"
                textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
              />
              <p className="mt-1 text-xs text-muted">
                Requested {formatDateTime(request.requestedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                aria-label={`Accept join request from ${request.address}`}
                disabled={mutating}
                onClick={() => onApprove(request.address)}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Decline join request from ${request.address}`}
                disabled={mutating}
                onClick={() => onDecline(request.address)}
              >
                Decline
              </Button>
            </div>
          </article>
        ))}
      </div>
    </GlassySection>
  );
}
