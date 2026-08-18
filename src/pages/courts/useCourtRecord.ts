import { useCallback, useEffect, useRef, useState } from "react";

import { formatLoadError } from "@/lib/errorFormatting";

export function useCourtRecord<T>({
  enabled,
  load,
}: {
  enabled: boolean;
  load: () => Promise<T>;
}) {
  const requestVersion = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const next = await load();
      if (requestVersion.current !== version) return;
      setData(next);
    } catch (loadError) {
      if (requestVersion.current !== version) return;
      const message = formatLoadError(
        loadError instanceof Error ? loadError.message : String(loadError),
      );
      setError(message);
      throw loadError;
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;
    void reload().catch(() => undefined);
    return () => {
      requestVersion.current += 1;
    };
  }, [enabled, reload]);

  return { data, error, loading, reload, setData };
}
