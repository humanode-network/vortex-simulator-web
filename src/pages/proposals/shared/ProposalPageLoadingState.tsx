import { PageHint } from "@/components/PageHint";
import { Surface } from "@/components/Surface";
import { formatLoadError } from "@/lib/errorFormatting";

type ProposalPageLoadingStateProps = {
  fallbackMessage: string;
  loadError: string | null;
  transitionNotice?: string | null;
  unavailableLabel: string;
  unavailableFallback: string;
};

export function ProposalPageLoadingState({
  fallbackMessage,
  loadError,
  transitionNotice,
  unavailableLabel,
  unavailableFallback,
}: ProposalPageLoadingStateProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      {transitionNotice ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {transitionNotice}
        </Surface>
      ) : null}
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        {loadError
          ? `${unavailableLabel}: ${formatLoadError(loadError, unavailableFallback)}`
          : fallbackMessage}
      </Surface>
    </div>
  );
}
