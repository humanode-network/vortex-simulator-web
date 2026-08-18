import { useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/primitives/button";
import { apiCourtReportingCapabilityV2 } from "@/lib/apiClient";
import type { CourtTargetReferenceV2Dto } from "@/types/api";
import { courtReportPath } from "./courtReportTarget";

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
  const [status, setStatus] = useState<"idle" | "checking" | "unavailable">(
    "idle",
  );
  useEffect(() => setStatus("idle"), [target.id, target.revision, target.type]);
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return (
    <span className="relative inline-flex min-w-0">
      <Button
        className={className}
        size={size}
        variant="outline"
        aria-busy={status === "checking"}
        aria-describedby={status === "unavailable" ? feedbackId : undefined}
        aria-label={`Report this ${target.type.replace(/_/g, " ")}`}
        disabled={status === "checking"}
        onClick={async () => {
          setStatus("checking");
          try {
            const result = await apiCourtReportingCapabilityV2({
              target,
            });
            if (result.status !== "available") {
              setStatus("unavailable");
              return;
            }
            navigate(courtReportPath(target, returnTo));
          } catch {
            setStatus("unavailable");
          }
        }}
      >
        {status === "checking" ? "Checking..." : label}
      </Button>
      <span
        id={feedbackId}
        className={
          status === "unavailable"
            ? "absolute top-[calc(100%+0.35rem)] right-0 z-30 w-max max-w-64 border border-destructive/35 bg-popover px-2 py-1.5 text-left text-xs text-destructive shadow-lg"
            : "sr-only"
        }
        role={status === "unavailable" ? "alert" : undefined}
      >
        {status === "unavailable"
          ? "Reporting is unavailable for this record."
          : ""}
      </span>
    </span>
  );
}
