import { expect, test } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { AddressInline } from "../../src/components/AddressInline";

test("AddressInline degrades safely when a runtime projection omits an address", () => {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <AddressInline address={undefined} />
    </MemoryRouter>,
  );

  expect(markup).toContain("Unknown address");
  expect(markup).not.toContain("Copy address");
  expect(markup).not.toContain("/app/human-nodes/");
});
