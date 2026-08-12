import {
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { PageHint } from "@/components/PageHint";

type CourtsUnavailableProps = {
  pageId: string;
  reason?: string;
  title: string;
};

export function CourtsUnavailable({
  pageId,
  reason,
  title,
}: CourtsUnavailableProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId={pageId} />
      <GlassySection title={title}>
        <GlassyTile className="space-y-3">
          <GlassyStatusChip tone="warn">Unavailable</GlassyStatusChip>
          <p className="max-w-3xl text-sm leading-6 text-text">
            Court proceedings remain unavailable while reporting, evidence
            access, jury selection, sentencing, enforcement, and appeals are
            completed.
          </p>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            {reason ??
              "Legacy case records remain preserved, but they are not presented as complete Court procedure."}
          </p>
        </GlassyTile>
      </GlassySection>
    </div>
  );
}
