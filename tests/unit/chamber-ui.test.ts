import { expect, test } from "@rstest/core";

import { formatChamberLabel } from "../../src/lib/chamberUi";

test("formatChamberLabel uses the General chamber label for empty and general ids", () => {
  expect(formatChamberLabel("")).toBe("General chamber");
  expect(formatChamberLabel("general")).toBe("General chamber");
});

test("formatChamberLabel uses chamber names when available and falls back to id", () => {
  const chambers = [{ id: "dev", name: "Development" }];
  expect(formatChamberLabel("dev", chambers)).toBe("Development");
  expect(formatChamberLabel("design", chambers)).toBe("design");
});
