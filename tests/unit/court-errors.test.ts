import { describe, expect, test } from "@rstest/core";

import { courtErrorIssue } from "@/pages/courts/courtErrors";

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
  });
});
