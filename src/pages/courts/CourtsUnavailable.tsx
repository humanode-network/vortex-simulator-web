import {
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";

type CourtsUnavailableProps = {
  checking?: boolean;
  pageId: string;
  failed?: boolean;
  onRetry?: () => void;
  reason?: string;
  title: string;
};

export function CourtsUnavailable({
  checking = false,
  failed = false,
  onRetry,
  pageId,
  reason,
  title,
}: CourtsUnavailableProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId={pageId} />
      <GlassySection title={title}>
        <GlassyTile className="space-y-3">
          <GlassyStatusChip
            tone={failed ? "danger" : checking ? "neutral" : "warn"}
          >
            {failed
              ? "Connection failed"
              : checking
                ? "Checking availability"
                : "Not activated"}
          </GlassyStatusChip>
          <p className="max-w-3xl text-sm leading-6 text-text">
            {checking
              ? "Checking whether Court reporting and proceedings are available in this environment."
              : failed
                ? "The app could not verify the Court runtime state. No Court action was attempted."
                : "Court reporting and proceedings are implemented but have not been activated for this environment."}
          </p>
          {!checking ? (
            <p className="max-w-3xl text-sm leading-6 text-muted">
              {reason ??
                "Legacy case records remain preserved, but they are not presented as complete Court procedure."}
            </p>
          ) : null}
          {failed && onRetry ? (
            <div>
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry status check
              </Button>
            </div>
          ) : null}
        </GlassyTile>
      </GlassySection>
    </div>
  );
}
