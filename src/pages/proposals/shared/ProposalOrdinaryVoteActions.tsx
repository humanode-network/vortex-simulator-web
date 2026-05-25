import { Input } from "@/components/primitives/input";
import { VoteButton } from "@/components/VoteButton";

type OrdinaryVoteChoice = "yes" | "no" | "abstain";

type OrdinaryVoteGate = {
  disabled: boolean;
  title: string | undefined;
};

type ProposalOrdinaryVoteActionsProps = {
  gate: OrdinaryVoteGate;
  onVote: (choice: OrdinaryVoteChoice, score?: number) => void;
  score?: {
    label: string;
    onChange: (value: number) => void;
    value: number;
  } | null;
};

export function ProposalOrdinaryVoteActions({
  gate,
  onVote,
  score,
}: ProposalOrdinaryVoteActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <VoteButton
        tone="accent"
        label="Vote yes"
        requiresEligibility={false}
        disabled={gate.disabled}
        title={gate.title}
        onClick={() => onVote("yes", score?.value)}
      />
      {score ? (
        <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm text-text">
          <span className="text-xs font-semibold text-muted uppercase">
            {score.label} score
          </span>
          <Input
            type="number"
            min={0}
            max={10}
            step={1}
            value={score.value}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                score.onChange(Math.min(Math.max(Math.round(next), 0), 10));
              }
            }}
            className="h-8 w-16"
          />
        </div>
      ) : null}
      <VoteButton
        tone="destructive"
        label="Vote no"
        requiresEligibility={false}
        disabled={gate.disabled}
        title={gate.title}
        onClick={() => onVote("no")}
      />
      <VoteButton
        tone="neutral"
        label="Abstain"
        requiresEligibility={false}
        disabled={gate.disabled}
        title={gate.title}
        onClick={() => onVote("abstain")}
      />
    </div>
  );
}
