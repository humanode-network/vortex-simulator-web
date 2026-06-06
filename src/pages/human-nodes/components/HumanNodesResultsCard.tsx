import { Link } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import { HintLabel } from "@/components/Hint";
import { Kicker } from "@/components/Kicker";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardFooter } from "@/components/primitives/card";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import {
  isLikelyHumanodeAddress,
  type HumanNodesSortBy,
} from "@/lib/humanNodesUi";
import { DETAIL_TILE_CLASS, normalizeDetailValue } from "@/lib/profileUi";
import type {
  ChamberDto,
  FactionDto,
  FormationProjectDto,
  HumanNodeDto,
} from "@/types/api";

type HumanNodesView = "cards" | "list";

type HumanNodesResultsCardProps = {
  chambersById: Record<string, ChamberDto>;
  effectiveView: HumanNodesView;
  factionsById: Record<string, FactionDto>;
  filtered: HumanNodeDto[];
  formationProjectsById: Record<string, FormationProjectDto>;
  isMobileViewport: boolean;
  onSortByChange: (sortBy: HumanNodesSortBy) => void;
  onViewChange: (view: HumanNodesView) => void;
  sortBy: HumanNodesSortBy;
};

export function HumanNodesResultsCard({
  chambersById,
  effectiveView,
  factionsById,
  filtered,
  formationProjectsById,
  isMobileViewport,
  onSortByChange,
  onViewChange,
  sortBy,
}: HumanNodesResultsCardProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <SectionHeader>
        <Kicker>Results ({filtered.length})</Kicker>
      </SectionHeader>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Label htmlFor="sort" className="font-semibold">
              Sort by
            </Label>
            <Select
              id="sort"
              className="h-10 w-full sm:min-w-[180px]"
              value={sortBy}
              onChange={(e) =>
                onSortByChange(e.target.value as HumanNodesSortBy)
              }
            >
              <option value="acm-desc">ACM (desc)</option>
              <option value="acm-asc">ACM (asc)</option>
              <option value="tier">Tier</option>
              <option value="name">Name</option>
            </Select>
          </div>
          {!isMobileViewport ? (
            <ToggleGroup
              className="ml-auto"
              value={effectiveView}
              onValueChange={(val) => {
                onViewChange(val as HumanNodesView);
              }}
              options={[
                { value: "cards", label: "Cards" },
                { value: "list", label: "List" },
              ]}
            />
          ) : null}
        </div>

        {effectiveView === "cards" ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((node) => {
              const factionName = factionsById[node.factionId]?.name ?? "-";
              const nameIsAddress = isLikelyHumanodeAddress(node.name);
              const formationProjects = (node.formationProjectIds ?? [])
                .map((projectId) => formationProjectsById[projectId]?.title)
                .filter((title): title is string => Boolean(title));
              const formationProjectLabel =
                formationProjects.length === 0
                  ? "-"
                  : formationProjects.length === 1
                    ? formationProjects[0]
                    : `${formationProjects[0]} + ${
                        formationProjects.length - 1
                      }`;
              const tileItems = [
                {
                  label: "ACM",
                  value: (node.cmTotals?.acm ?? node.acm).toString(),
                },
                {
                  label: "Tier",
                  value: (
                    <TierLabel tier={node.tier}>
                      {node.tier.charAt(0).toUpperCase() + node.tier.slice(1)}
                    </TierLabel>
                  ),
                },
                { label: "Faction", value: factionName },
                {
                  label: "Governor",
                  value: node.active.governorActive ? "Active" : "Not active",
                },
                {
                  label: "Human node",
                  value: node.active.humanNodeActive ? "Active" : "Inactive",
                },
                {
                  label: "Main chamber",
                  value: chambersById[node.chamber]?.name ?? node.chamber,
                },
                {
                  label: "Formation member",
                  value: node.formationCapable ? "Yes" : "No",
                },
                {
                  label: "Formation project",
                  value: formationProjectLabel,
                },
                {
                  label: "Human node for",
                  value: normalizeDetailValue(
                    "Human node for",
                    node.memberSince,
                  ),
                },
              ];
              return (
                <Card key={node.id}>
                  <CardContent className="flex flex-col gap-4 pt-4">
                    <div>
                      {nameIsAddress ? (
                        <AddressInline
                          address={node.id}
                          className="mx-auto flex w-full items-center justify-center"
                          textClassName="text-2xl font-semibold tracking-wide sm:text-3xl"
                        />
                      ) : (
                        <h3 className="text-lg font-semibold">{node.name}</h3>
                      )}
                      {!nameIsAddress ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                          <Badge
                            size="sm"
                            variant="muted"
                            title={node.id}
                            className="max-w-[220px] pr-1"
                          >
                            <AddressInline address={node.id} />
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
                      {tileItems.map((item) => (
                        <StatTile
                          key={item.label}
                          label={
                            item.label === "ACM" ? (
                              <HintLabel termId="acm">ACM</HintLabel>
                            ) : item.label === "MM" ? (
                              <HintLabel termId="meritocratic_measure">
                                MM
                              </HintLabel>
                            ) : (
                              item.label
                            )
                          }
                          value={item.value}
                          radius="xl"
                          variant="panelAlt"
                          className={DETAIL_TILE_CLASS}
                          labelClassName="text-[0.65rem]"
                          valueClassName="text-base"
                        />
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2 pt-0">
                    <Button asChild size="sm">
                      <Link to={`/app/human-nodes/${node.id}`}>
                        Open profile
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((node) => {
              const nameIsAddress = isLikelyHumanodeAddress(node.name);
              return (
                <Card key={node.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-0 flex-1">
                        {nameIsAddress ? (
                          <AddressInline
                            address={node.id}
                            className="max-w-full"
                            textClassName="text-lg font-semibold tracking-wide sm:text-xl"
                          />
                        ) : (
                          <h4 className="text-base font-semibold">
                            {node.name}
                          </h4>
                        )}
                        <p className="text-sm text-muted">
                          <TierLabel tier={node.tier}>
                            {node.tier.charAt(0).toUpperCase() +
                              node.tier.slice(1)}
                          </TierLabel>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge size="sm" variant="outline">
                          {factionsById[node.factionId]?.name ?? "-"}
                        </Badge>
                        <Badge size="sm">
                          <HintLabel termId="acm" className="mr-1">
                            ACM
                          </HintLabel>{" "}
                          {node.cmTotals?.acm ?? node.acm}
                        </Badge>
                        {node.formationCapable && (
                          <Badge size="sm" variant="outline">
                            Active node
                          </Badge>
                        )}
                      </div>
                      <div className="ml-auto">
                        <Button asChild size="sm">
                          <Link to={`/app/human-nodes/${node.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
