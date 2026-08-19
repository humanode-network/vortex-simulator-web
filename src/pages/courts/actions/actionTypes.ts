import type { CourtActionCapability } from "../model/courtCapabilities";

export type CourtActionAvailability = (
  capability: CourtActionCapability,
) => boolean;

export type RunCourtAction = (
  name: string,
  action: (idempotencyKey: string) => Promise<unknown>,
  onConfirmed?: () => void,
  unlockAfterRefresh?: boolean,
) => Promise<void>;

export type CourtActionGroupProps = {
  actionLocked: (name: string) => boolean;
  busy: string | null;
  can: CourtActionAvailability;
  caseId: string;
  run: RunCourtAction;
};
