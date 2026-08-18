import { useCallback, useEffect, useRef, useState } from "react";

import { formatLoadError } from "@/lib/errorFormatting";

export function useCourtRecord<T>({
  enabled,
  load,
  recordKey,
}: {
  enabled: boolean;
  load: () => Promise<T>;
  recordKey: string | null | undefined;
}) {
  const requestVersion = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [dataKey, setDataKey] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestVersion.current += 1;
    setData(null);
    setDataKey(undefined);
    setError(null);
    setLoading(false);
  }, [recordKey]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const version = ++requestVersion.current;
    const requestedKey = recordKey;
    setLoading(true);
    setError(null);
    try {
      const next = await load();
      if (requestVersion.current !== version) return;
      setData(next);
      setDataKey(requestedKey);
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
  }, [enabled, load, recordKey]);

  useEffect(() => {
    if (!enabled) return;
    void reload().catch(() => undefined);
    return () => {
      requestVersion.current += 1;
    };
  }, [enabled, reload]);

  return {
    data: dataKey === recordKey ? data : null,
    error,
    loading,
    reload,
    setData,
  };
}
