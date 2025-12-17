import { Link } from "react-router";

import { Button } from "@/components/primitives/button";

const Paper: React.FC = () => {
  return (
    <div className="relative min-h-[100svh] overflow-hidden px-6 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_10%,rgba(255,255,255,0.10),transparent_60%),linear-gradient(to_bottom,rgba(2,6,23,0.55),rgba(2,6,23,0.88))]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-xl flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Paper
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          Drop your PDF at <code className="text-white">public/paper.pdf</code>{" "}
          (or wire an external URL) and we’ll point this button to it.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="primary" className="min-w-[200px]">
            <a href="/paper.pdf" target="_blank" rel="noreferrer">
              Open paper
            </a>
          </Button>
          <Button asChild variant="ghost" className="min-w-[160px]">
            <Link to="/">Back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Paper;
