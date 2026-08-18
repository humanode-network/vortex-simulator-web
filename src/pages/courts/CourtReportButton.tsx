import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/primitives/button";
import { apiCourtReportingCapabilityV2 } from "@/lib/apiClient";
import type { CourtTargetReferenceV2Dto } from "@/types/api";
import {
  courtErrorIssue,
  courtReportingUnavailableMessage,
} from "./model/courtErrors";
import { courtReportPath } from "./model/courtReportTarget";

export function CourtReportButton({
  className,
  label = "Report",
  size = "sm",
  target,
}: {
  className?: string;
  label?: string;
  size?: "compact" | "sm";
  target: CourtTargetReferenceV2Dto;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const feedbackId = useId();
  const requestVersion = useRef(0);
  const [status, setStatus] = useState<
    { kind: "idle" | "checking" } | { kind: "unavailable"; reason: string }
  >({ kind: "idle" });
  useEffect(() => {
    requestVersion.current += 1;
    setStatus({ kind: "idle" });
  }, [target.id, target.revision, target.type]);
  useEffect(
    () => () => {
      requestVersion.current += 1;
    },
    [],
  );
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return (
    <span className="relative inline-flex min-w-0">
      <Button
        className={className}
        size={size}
        variant="outline"
        type="button"
        aria-busy={status.kind === "checking"}
        aria-describedby={
          status.kind === "unavailable" ? feedbackId : undefined
        }
        aria-label={`Report this ${target.type.replace(/_/g, " ")}`}
        disabled={status.kind === "checking"}
        onClick={async () => {
          const version = ++requestVersion.current;
          setStatus({ kind: "checking" });
          try {
            const result = await apiCourtReportingCapabilityV2({
              target,
            });
            if (requestVersion.current !== version) return;
            if (result.status !== "available") {
              setStatus({
                kind: "unavailable",
                reason: courtReportingUnavailableMessage(result.reason),
              });
              return;
            }
            navigate(courtReportPath(target, returnTo));
          } catch (error) {
            if (requestVersion.current !== version) return;
            setStatus({
              kind: "unavailable",
              reason: courtErrorIssue(error).message,
            });
          }
        }}
      >
        {status.kind === "checking" ? "Checking..." : label}
      </Button>
      <span
        id={feedbackId}
        className={
          status.kind === "unavailable"
            ? "absolute top-[calc(100%+0.35rem)] right-0 z-30 w-max max-w-64 border border-destructive/35 bg-popover px-2 py-1.5 text-left text-xs text-destructive shadow-lg"
            : "sr-only"
        }
        role={status.kind === "unavailable" ? "alert" : undefined}
      >
        {status.kind === "unavailable" ? status.reason : ""}
      </span>
    </span>
  );
}
