import { AddressInline } from "@/components/AddressInline";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { formatDateTime } from "@/lib/dateTime";
import type { ChamberProposalPageDto } from "@/types/api";

type ChamberDelegation = NonNullable<ChamberProposalPageDto["delegation"]>;

type ProposalDelegationContextProps = {
  delegation: ChamberDelegation;
};

const getDelegationNote = (delegation: ChamberDelegation) => {
  if (delegation.viewer) {
    if (delegation.viewer.delegateeAddress) {
      if (delegation.viewer.hasDirectVote) {
        return (
          <>
            Direct vote overrides your delegation to{" "}
            <AddressInline
              address={delegation.viewer.delegateeAddress}
              showCopy={false}
            />
            .
          </>
        );
      }

      return (
        <>
          You delegate to{" "}
          <AddressInline
            address={delegation.viewer.delegateeAddress}
            showCopy={false}
          />
          . Direct vote overrides it here.
        </>
      );
    }

    if (delegation.viewer.inboundDelegatedWeight > 0) {
      return <>Your vote currently carries delegated weight.</>;
    }

    return null;
  }

  return delegation.source === "snapshot" ? (
    <>Uses a frozen delegation snapshot.</>
  ) : (
    <>Uses current chamber delegations.</>
  );
};

export const ProposalDelegationContext: React.FC<
  ProposalDelegationContextProps
> = ({ delegation }) => {
  const delegationNote = getDelegationNote(delegation);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Delegation context</h2>
      <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Vote weight source"
          value={
            <>
              <span>
                {delegation.source === "snapshot"
                  ? "Snapshot-backed"
                  : "Live delegation"}
              </span>
              <span className="text-xs font-semibold text-muted">
                {delegation.snapshotCapturedAt
                  ? formatDateTime(delegation.snapshotCapturedAt)
                  : "No captured timestamp"}
              </span>
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
        <StatTile
          label="Delegation links"
          value={
            <>
              <span>{delegation.activeDelegations}</span>
              <span className="text-xs font-semibold text-muted">
                {delegation.activeDelegatees} active delegatees
              </span>
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
        <StatTile
          label="Your effective weight"
          value={
            delegation.viewer ? (
              <>
                <span>{delegation.viewer.effectiveVotingWeight}</span>
                <span className="text-xs font-semibold text-muted">
                  1 base + {delegation.viewer.inboundDelegatedWeight} delegated
                </span>
              </>
            ) : (
              <>
                <span>-</span>
                <span className="text-xs font-semibold text-muted">
                  Sign in to inspect your vote power
                </span>
              </>
            )
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
      </div>
      {delegationNote ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {delegationNote}
        </Surface>
      ) : null}
    </section>
  );
};
