import { useEffect, useState } from "react";

type Resource<T> = { key: string } & (
  | { state: "ready"; data: T }
  | { state: "checking" | "unavailable"; data?: never }
);

export function usePolledResource<T>({
  resourceKey,
  load,
  refreshKey,
  refreshOnFocus = false,
  intervalMs = 60_000,
}: {
  resourceKey: string | null;
  load: (key: string) => Promise<T>;
  refreshKey?: string | number;
  refreshOnFocus?: boolean;
  intervalMs?: number;
}) {
  const [result, setResult] = useState<Resource<T> | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!resourceKey) {
      setResult(null);
      return;
    }
    let current = true;
    let pending = false;
    const sync = async () => {
      if (!current || pending) return;
      pending = true;
      setResult((previous) =>
        previous?.key === resourceKey && previous.state === "ready"
          ? previous
          : { key: resourceKey, state: "checking" },
      );
      try {
        const data = await load(resourceKey);
        if (current) setResult({ key: resourceKey, state: "ready", data });
      } catch {
        if (current) setResult({ key: resourceKey, state: "unavailable" });
      } finally {
        pending = false;
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), intervalMs);
    if (refreshOnFocus) window.addEventListener("focus", sync);
    return () => {
      current = false;
      window.clearInterval(timer);
      if (refreshOnFocus) window.removeEventListener("focus", sync);
    };
  }, [resourceKey, load, refreshKey, refreshOnFocus, intervalMs, revision]);

  return {
    result: result?.key === resourceKey ? result : null,
    retry: () => setRevision((value) => value + 1),
  };
}
