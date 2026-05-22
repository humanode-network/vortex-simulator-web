import { useEffect, useState } from "react";

import {
  apiChambers,
  apiFactions,
  apiFormation,
  apiHumans,
} from "@/lib/apiClient";
import type {
  ChamberDto,
  FactionDto,
  FormationProjectDto,
  HumanNodeDto,
} from "@/types/api";

export function useHumanNodesPageData() {
  const [nodes, setNodes] = useState<HumanNodeDto[] | null>(null);
  const [factionsById, setFactionsById] = useState<Record<string, FactionDto>>(
    {},
  );
  const [chambersById, setChambersById] = useState<Record<string, ChamberDto>>(
    {},
  );
  const [formationProjectsById, setFormationProjectsById] = useState<
    Record<string, FormationProjectDto>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [humansRes, factionsRes, chambersRes, formationRes] =
          await Promise.all([
            apiHumans(),
            apiFactions(),
            apiChambers(),
            apiFormation(),
          ]);
        if (!active) return;
        setNodes(humansRes.items);
        setFactionsById(
          Object.fromEntries(factionsRes.items.map((f) => [f.id, f] as const)),
        );
        setChambersById(
          Object.fromEntries(chambersRes.items.map((c) => [c.id, c] as const)),
        );
        setFormationProjectsById(
          Object.fromEntries(
            formationRes.projects.map((p) => [p.id, p] as const),
          ),
        );
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setNodes([]);
        setFactionsById({});
        setChambersById({});
        setFormationProjectsById({});
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    chambersById,
    factionsById,
    formationProjectsById,
    loadError,
    nodes,
  };
}
