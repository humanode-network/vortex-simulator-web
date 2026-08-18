import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { test } from "@rstest/core";

import Courtroom from "../../src/pages/courts/Courtroom";
import Courts from "../../src/pages/courts/Courts";

function render(element: React.ReactElement, path: string) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, element),
  );
}

test("Courts routes expose one honest quarantine surface", () => {
  const directory = render(createElement(Courts), "/app/courts");
  const courtroom = render(createElement(Courtroom), "/app/courts/legacy-case");

  for (const html of [directory, courtroom]) {
    assert.match(html, /Checking availability/);
    assert.match(html, /Checking whether Court reporting/);
    assert.doesNotMatch(html, /New reports|Ended \(30d\)|Open courtroom/);
  }
});
