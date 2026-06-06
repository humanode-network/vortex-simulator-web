import { useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { SearchBar } from "@/components/SearchBar";
import { MetricTile } from "@/components/MetricTile";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiFormation } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { cn } from "@/lib/utils";
import type {
  FormationCategoryDto as Category,
  FormationProjectDto,
  FormationStageDto as Stage,
  GetFormationResponse,
} from "@/types/api";
import {
  FormationProjectCard,
  formationProjectCardFromDto,
} from "./components/FormationProjectCard";

function FormationLoadingMessage({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "danger" | "neutral";
}) {
  return (
    <Surface
      borderStyle="dashed"
      className={cn(
        "px-4 py-6 text-center text-sm",
        tone === "danger" ? "text-destructive" : "text-muted",
      )}
      radius="2xl"
      shadow="tile"
      variant="glass"
    >
      {children}
    </Surface>
  );
}

const Formation: React.FC = () => {
  const [data, setData] = useState<GetFormationResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    stageFilter: Stage | "any";
    categoryFilter: Category;
  }>({ stageFilter: "any", categoryFilter: "all" });
  const { stageFilter, categoryFilter } = filters;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFormation();
        if (!active) return;
        setData(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setData({ metrics: [], projects: [] });
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const projects: FormationProjectDto[] = data?.projects ?? [];
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        term.length === 0 ||
        project.title.toLowerCase().includes(term) ||
        project.proposer.toLowerCase().includes(term) ||
        project.summary.toLowerCase().includes(term) ||
        project.focus.toLowerCase().includes(term) ||
        (project.chamberTitle ?? project.chamber ?? "")
          .toLowerCase()
          .includes(term);
      const matchesStage =
        stageFilter === "any" ? true : project.stage === stageFilter;
      const matchesCategory =
        categoryFilter === "all" ? true : project.category === categoryFilter;
      return matchesSearch && matchesStage && matchesCategory;
    });
  }, [projects, search, stageFilter, categoryFilter]);

  return (
    <div className="formation-page flex flex-col gap-6">
      <PageHint pageId="formation" />
      {data === null ? (
        <FormationLoadingMessage>Loading Formation…</FormationLoadingMessage>
      ) : null}
      {loadError ? (
        <FormationLoadingMessage tone="danger">
          Formation unavailable: {formatLoadError(loadError)}
        </FormationLoadingMessage>
      ) : null}
      {data !== null && projects.length === 0 && !loadError ? (
        <NoDataYetBar label="Formation projects" />
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric) => (
          <div
            key={metric.label}
            data-metric={metric.dataAttr}
            className="contents"
          >
            <MetricTile
              label={metric.label}
              value={metric.value}
              className="px-4 py-5"
            />
          </div>
        ))}
      </section>

      <section role="search" className="space-y-2">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project, proposer, focus, stage…"
          ariaLabel="Search projects"
          inputClassName="w-full"
          filtersConfig={[
            {
              key: "stageFilter",
              label: "Stage",
              options: [
                { value: "any", label: "Any stage" },
                { value: "live", label: "Live" },
                { value: "gathering", label: "Gathering team" },
                { value: "completed", label: "Completed" },
              ],
            },
            {
              key: "categoryFilter",
              label: "Category",
              options: [
                { value: "all", label: "All focuses" },
                { value: "research", label: "Research" },
                { value: "development", label: "Development & Product" },
                { value: "social", label: "Social Good & Community" },
              ],
            },
          ]}
          filtersState={filters}
          onFiltersChange={setFilters}
        />
      </section>

      <section
        aria-live="polite"
        className="formation-project-grid"
        data-formation-list={filteredProjects.length}
      >
        {filteredProjects.map((project) => (
          <FormationProjectCard
            key={project.id}
            project={formationProjectCardFromDto(project)}
          />
        ))}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <Surface
            variant="panel"
            borderStyle="dashed"
            className="px-4 py-8 text-center text-sm text-muted"
          >
            No Formation projects match the current filters.
          </Surface>
        )}
      </section>
    </div>
  );
};

export default Formation;
