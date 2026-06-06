import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { ToggleGroup } from "@/components/ToggleGroup";
import {
  ACTIVITY_FILTERS,
  type ActivityFilter,
  formatActivityTimestamp,
} from "@/lib/profileUi";
import {
  FormationProjectCard,
  formationProjectCardFromProfileProject,
} from "@/pages/formation/components/FormationProjectCard";
import type { HumanNodeProfileDto } from "@/types/api";

type GovernanceAction = HumanNodeProfileDto["governanceActions"][number];
type FormationProject = HumanNodeProfileDto["projects"][number];

type ProfileGovernanceActivitySectionProps = {
  activityFilter: ActivityFilter;
  className?: string;
  filteredActions: GovernanceAction[];
  historyHref: string | null;
  onActivityFilterChange: (filter: ActivityFilter) => void;
};

type ProfileFormationProjectsSectionProps = {
  className?: string;
  projects: FormationProject[];
};

export function ProfileGovernanceActivitySection({
  activityFilter,
  className,
  filteredActions,
  historyHref,
  onActivityFilterChange,
}: ProfileGovernanceActivitySectionProps) {
  const filterOptions = ACTIVITY_FILTERS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <GlassySection className={className} title="Governance activity">
      <div className="profile-activity-controls">
        <ToggleGroup
          value={activityFilter}
          onValueChange={(val) =>
            onActivityFilterChange((val as ActivityFilter) || "all")
          }
          options={filterOptions}
          className="profile-activity-controls__filters"
        />
        {historyHref ? (
          <Button
            asChild
            className="profile-activity-controls__history"
            size="compact"
            variant="outline"
          >
            <Link to={historyHref}>Full History</Link>
          </Button>
        ) : null}
      </div>
      {filteredActions.length ? (
        <div className="grid gap-2">
          {filteredActions.map((action) => {
            const row = (
              <GlassyTile className="profile-activity-row">
                <GlassyStatusChip
                  className="profile-activity-row__action"
                  tone="primary"
                >
                  {action.action}
                </GlassyStatusChip>
                <div className="profile-activity-row__copy">
                  <p className="profile-activity-row__title">{action.title}</p>
                  <p className="profile-activity-row__context">
                    {action.context}
                  </p>
                  <p className="profile-activity-row__detail">
                    {action.detail}
                  </p>
                </div>
                <GlassyStatusChip className="profile-activity-row__time">
                  {formatActivityTimestamp(action.timestamp)}
                </GlassyStatusChip>
              </GlassyTile>
            );

            return action.href ? (
              <Link
                key={`${action.title}-${action.timestamp}`}
                to={action.href}
                className="block"
              >
                {row}
              </Link>
            ) : (
              <div key={`${action.title}-${action.timestamp}`}>{row}</div>
            );
          })}
        </div>
      ) : (
        <GlassyTile className="text-sm text-muted">
          No activity to show yet.
        </GlassyTile>
      )}
    </GlassySection>
  );
}

export function ProfileFormationProjectsSection({
  className,
  projects,
}: ProfileFormationProjectsSectionProps) {
  return (
    <GlassySection className={className} title="Formation projects">
      {projects.length ? (
        <div className="formation-project-grid formation-project-grid--pair">
          {projects.map((project) => (
            <FormationProjectCard
              key={project.title}
              project={formationProjectCardFromProfileProject(project)}
            />
          ))}
        </div>
      ) : (
        <GlassyTile className="text-sm text-muted">
          Not participating in Formation right now.
        </GlassyTile>
      )}
    </GlassySection>
  );
}
