import { describe, expect, test } from "@rstest/core";

import {
  courtErrorIssue,
  courtReportingUnavailableMessage,
} from "@/pages/courts/model/courtErrors";

describe("Court error presentation", () => {
  test("maps structured Court errors to actionable copy and fields", () => {
    const error = Object.assign(new Error("HTTP 409: Court action failed"), {
      status: 409,
      data: {
        error: {
          code: "COURT_CASE_STATE_CONFLICT",
          fields: ["caseId"],
        },
      },
    });

    expect(courtErrorIssue(error)).toEqual({
      category: "stale_state",
      code: "COURT_CASE_STATE_CONFLICT",
      fields: ["caseId"],
      message:
        "The case moved to another step. Reload the record before trying again.",
    });
  });

  test("retains a safe server message when no Court code is available", () => {
    expect(
      courtErrorIssue(
        Object.assign(new Error("HTTP 503: Temporarily offline"), {
          status: 503,
        }),
      ),
    ).toMatchObject({
      category: "runtime",
      code: null,
      message: "Temporarily offline",
    });
    expect(
      courtErrorIssue(
        Object.assign(new Error("HTTP 409: Amendment incomplete"), {
          status: 409,
          data: {
            error: {
              code: "COURT_AMENDMENT_FIELD_REQUIRED",
              field: "respondentId",
            },
          },
        }),
      ),
    ).toMatchObject({
      fields: ["respondentId"],
      message:
        "Complete every correction requested by Court intake before resubmitting this report.",
    });
    expect(
      courtErrorIssue(
        Object.assign(new Error("HTTP 409: Bundle identity locked"), {
          status: 409,
          data: {
            error: {
              code: "COURT_REPORT_BUNDLE_FIELDS_LOCKED",
              field: "respondentId|incidentWindow",
            },
          },
        }),
      ),
    ).toMatchObject({
      fields: ["respondentId|incidentWindow"],
      message:
        "The respondent and incident window are locked after this report joins a Court case bundle.",
    });
  });

  test("explains invalid report input and preserves its responsible field", () => {
    expect(
      courtErrorIssue(
        Object.assign(new Error("HTTP 422: Court report is not admissible"), {
          status: 422,
          data: {
            error: {
              code: "COURT_REPORT_INPUT_INVALID",
              fields: ["incidentWindow"],
            },
          },
        }),
      ),
    ).toMatchObject({
      category: "validation",
      fields: ["incidentWindow"],
      message:
        "One or more report fields are invalid. Review the highlighted field before submitting again.",
    });
  });

  test("turns reporting capability reasons into useful guidance", () => {
    const reasons = [
      "adapter_failure",
      "policy_unavailable",
      "population_unavailable",
      "reporter_not_eligible",
      "request_invalid",
      "standing_not_verified",
      "target_not_found",
      "target_not_visible",
      "target_unsupported",
    ];
    for (const reason of reasons) {
      expect(courtReportingUnavailableMessage(reason)).not.toContain("_");
      expect(courtReportingUnavailableMessage(reason)).not.toBe(
        "Reporting is unavailable for this record right now.",
      );
    }
    expect(courtReportingUnavailableMessage("future_reason")).toBe(
      "Reporting is unavailable for this record right now.",
    );
  });
});
