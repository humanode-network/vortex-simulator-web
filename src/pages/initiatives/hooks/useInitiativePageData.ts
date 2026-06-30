import { useCallback, useEffect, useRef, useState } from "react";

import { apiInitiative } from "@/lib/apiClient";
import type { InitiativeDto } from "@/types/api";

export function useInitiativePageData(id?: string) {
  const requestGeneration = useRef(0);
  const [initiative, setInitiative] = useState<InitiativeDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setInitiative(null);
      setLoadError(null);
      return;
    }

    const generation = ++requestGeneration.current;
    try {
      const response = await apiInitiative(id);
      if (generation !== requestGeneration.current) return;
      setInitiative(response);
      setLoadError(null);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      setInitiative(null);
      setLoadError((error as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void reload();
    return () => {
      requestGeneration.current++;
    };
  }, [reload]);

  return { initiative, loadError, reload };
}
