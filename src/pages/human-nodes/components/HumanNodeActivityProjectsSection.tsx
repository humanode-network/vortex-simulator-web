import { Link } from "react-router";

import { ActivityTile } from "@/components/ActivityTile";
import { GlassySection, GlassyTile } from "@/components/GlassySection";
import { ToggleGroup } from "@/components/ToggleGroup";
import { ACTIVITY_FILTERS, type ActivityFilter } from "@/lib/profileUi";
import {
  FormationProjectCard,
  formationProjectCardFromProfileProject,
} from "@/pages/formation/components/FormationProjectCard";
import type { HumanNodeProfileDto } from "@/types/api";

type GovernanceAction = HumanNodeProfileDto["governanceActions"][number];
type FormationProject = HumanNodeProfileDto["projects"][number];

type HumanNodeActivityProjectsSectionProps = {
  activityFilter: ActivityFilter;
  filteredActions: GovernanceAction[];
  historyHref: string;
  onActivityFilterChange: (filter: ActivityFilter) => void;
  projects: FormationProject[];
};

export function HumanNodeActivityProjectsSection({
  activityFilter,
  filteredActions,
  historyHref,
  onActivityFilterChange,
  projects,
}: HumanNodeActivityProjectsSectionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassySection title="Governance activity">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={historyHref}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View full history
          </Link>
        </div>
        <ToggleGroup
          value={activityFilter}
          onValueChange={(val) =>
            onActivityFilterChange((val as ActivityFilter) || "all")
          }
          options={ACTIVITY_FILTERS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="w-fit"
        />
        {filteredActions.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredActions.map((action) => (
              <ActivityTile
                key={`${action.title}-${action.timestamp}`}
                action={action}
              />
            ))}
          </div>
        ) : (
          <GlassyTile className="text-sm text-muted">
            No activity to show yet.
          </GlassyTile>
        )}
      </GlassySection>

      <GlassySection title="Formation projects">
        {projects.length === 0 ? (
          <GlassyTile className="text-sm text-muted">
            Not participating in Formation right now.
          </GlassyTile>
        ) : (
          <div className="formation-project-grid formation-project-grid--pair">
            {projects.map((project) => (
              <FormationProjectCard
                key={project.title}
                project={formationProjectCardFromProfileProject(project)}
              />
            ))}
          </div>
        )}
      </GlassySection>
    </div>
  );
}
