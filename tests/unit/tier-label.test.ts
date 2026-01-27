import { test, expect } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { createElement } from "react";

import { TierLabel } from "../../src/components/TierLabel";

test("TierLabel renders tier text", () => {
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(TierLabel, { tier: "Consul" }),
    ),
  );
  expect(html).toContain("Consul");
});
