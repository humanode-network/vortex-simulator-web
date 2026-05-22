import { Link } from "react-router";

import { ActivityTile } from "@/components/ActivityTile";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/primitives/badge";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { ToggleGroup } from "@/components/ToggleGroup";
import { ACTIVITY_FILTERS, type ActivityFilter } from "@/lib/profileUi";
import type { HumanNodeProfileDto } from "@/types/api";

type GovernanceAction = HumanNodeProfileDto["governanceActions"][number];
type FormationProject = HumanNodeProfileDto["projects"][number];

type ProfileActivityProjectsSectionProps = {
  activityFilter: ActivityFilter;
  filteredActions: GovernanceAction[];
  historyHref: string | null;
  onActivityFilterChange: (filter: ActivityFilter) => void;
  projects: FormationProject[];
};

export function ProfileActivityProjectsSection({
  activityFilter,
  filteredActions,
  historyHref,
  onActivityFilterChange,
  projects,
}: ProfileActivityProjectsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader>Governance activity</SectionHeader>
          {historyHref ? (
            <Link
              to={historyHref}
              className="text-sm font-semibold text-primary hover:underline sm:self-auto"
            >
              View full history
            </Link>
          ) : null}
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
        />
        {filteredActions.length ? (
          <div className="grid max-h-none grid-cols-1 gap-3 overflow-visible pr-0 sm:grid-cols-2 lg:max-h-72 lg:overflow-y-auto lg:pr-2 xl:grid-cols-3">
            {filteredActions.map((action) => (
              <ActivityTile
                key={`${action.title}-${action.timestamp}`}
                action={action}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No activity to show yet.</p>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader>Formation projects</SectionHeader>
        {projects.length ? (
          <div className="space-y-3">
            {projects.map((project) => (
              <Surface
                key={project.title}
                variant="panelAlt"
                radius="xl"
                className="px-4 py-3"
              >
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-sm font-semibold text-text">
                    {project.title}
                  </p>
                  <Kicker align="center">{project.status}</Kicker>
                </div>
                <p className="text-center text-sm text-muted">
                  {project.summary}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {project.chips.map((chip) => (
                    <Badge key={chip} variant="outline">
                      {chip}
                    </Badge>
                  ))}
                </div>
              </Surface>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Not participating in Formation right now.
          </p>
        )}
      </div>
    </div>
  );
}
