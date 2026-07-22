import { expect, test } from "@rstest/core";
import { renderToStaticMarkup } from "react-dom/server";

import { AttachmentList } from "../../src/components/AttachmentList";

test("attachment links render only safe external protocols", () => {
  const markup = renderToStaticMarkup(
    <AttachmentList
      items={[
        {
          id: "safe",
          title: "Public evidence",
          href: "https://example.com/evidence",
        },
        {
          id: "unsafe",
          title: "Unsafe evidence",
          href: "javascript:alert(1)",
        },
        {
          id: "relative",
          title: "Relative evidence",
          href: "/evidence",
        },
      ]}
    />,
  );

  expect(markup).toContain('href="https://example.com/evidence"');
  expect(markup).not.toContain("javascript:");
  expect(markup).not.toContain("vortex.local");
  expect(markup).toContain("Unsafe evidence");
  expect(markup).toContain("Relative evidence");
});
