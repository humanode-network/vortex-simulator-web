import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/primitives/card";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { StatTile } from "@/components/StatTile";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  DETAIL_TILE_CLASS,
  normalizeDetailValue,
  shortAddress,
} from "@/lib/profileUi";
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

const HumanNodes: React.FC = () => {
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

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    sortBy: "acm-desc" | "acm-asc" | "tier" | "name";
    tierFilter:
      | "all"
      | "nominee"
      | "ecclesiast"
      | "legate"
      | "consul"
      | "citizen";
    statusFilter: "all" | "governor" | "human" | "inactive";
    cmRange: "all" | "0-50" | "50-200" | "200+";
  }>({
    sortBy: "acm-desc",
    tierFilter: "all",
    statusFilter: "all",
    cmRange: "all",
  });
  const { sortBy, tierFilter, statusFilter, cmRange } = filters;
  const [view, setView] = useState<"cards" | "list">("cards");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      const mobile = mediaQuery.matches;
      setIsMobileViewport(mobile);
      if (mobile) setView("list");
    };
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

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

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...(nodes ?? [])]
      .filter((node) => {
        const factionName =
          factionsById[node.factionId]?.name?.toLowerCase() ?? "";
        const chamberName =
          chambersById[node.chamber]?.name?.toLowerCase() ?? "";
        const matchesTerm =
          node.name.toLowerCase().includes(term) ||
          node.role.toLowerCase().includes(term) ||
          node.tags.some((t) => t.toLowerCase().includes(term)) ||
          node.chamber.toLowerCase().includes(term) ||
          chamberName.includes(term) ||
          factionName.includes(term);
        const matchesTier =
          tierFilter === "all" ? true : node.tier === tierFilter;
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "governor"
              ? node.active.governorActive
              : statusFilter === "human"
                ? node.active.humanNodeActive
                : !node.active.governorActive && !node.active.humanNodeActive;
        const acmValue = node.cmTotals?.acm ?? node.acm ?? 0;
        const matchesRange =
          cmRange === "all"
            ? true
            : cmRange === "0-50"
              ? acmValue <= 50
              : cmRange === "50-200"
                ? acmValue > 50 && acmValue <= 200
                : acmValue > 200;
        return matchesTerm && matchesTier && matchesStatus && matchesRange;
      })
      .sort((a, b) => {
        const acmA = a.cmTotals?.acm ?? a.acm;
        const acmB = b.cmTotals?.acm ?? b.acm;
        if (sortBy === "acm-desc") return acmB - acmA;
        if (sortBy === "acm-asc") return acmA - acmB;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const order = ["nominee", "ecclesiast", "legate", "consul", "citizen"];
        return order.indexOf(a.tier) - order.indexOf(b.tier);
      });
  }, [
    nodes,
    factionsById,
    chambersById,
    search,
    sortBy,
    tierFilter,
    statusFilter,
    cmRange,
  ]);

  const effectiveView = isMobileViewport ? "list" : view;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="human-nodes" />
      {nodes === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading human nodes…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Human nodes unavailable: {loadError}
        </Card>
      ) : null}
      {nodes !== null && nodes.length === 0 && !loadError ? (
        <NoDataYetBar label="human nodes" />
      ) : null}
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search human nodes by handle, chamber, focus…"
        ariaLabel="Search human nodes"
        filtersConfig={[
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "acm-desc", label: "ACM (desc)" },
              { value: "acm-asc", label: "ACM (asc)" },
              { value: "tier", label: "Tier" },
              { value: "name", label: "Name" },
            ],
          },
          {
            key: "tierFilter",
            label: "Tier filter",
            options: [
              { value: "all", label: "All tiers" },
              { value: "nominee", label: "Nominee" },
              { value: "ecclesiast", label: "Ecclesiast" },
              { value: "legate", label: "Legate" },
              { value: "consul", label: "Consul" },
              { value: "citizen", label: "Citizen" },
            ],
          },
          {
            key: "statusFilter",
            label: "Status",
            options: [
              { value: "all", label: "All statuses" },
              { value: "governor", label: "Governor active" },
              { value: "human", label: "Human node active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            key: "cmRange",
            label: "ACM range",
            options: [
              { value: "all", label: "All ACM" },
              { value: "0-50", label: "0–50" },
              { value: "50-200", label: "50–200" },
              { value: "200+", label: "200+" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      <Card className="w-full">
        <CardHeader className="pb-2">
          <Kicker>Results ({filtered.length})</Kicker>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
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
                  setFilters((curr) => ({
                    ...curr,
                    sortBy: e.target.value as typeof sortBy,
                  }))
                }
              >
                <option value="acm-desc">ACM (desc)</option>
                <option value="acm-asc">ACM (asc)</option>
                <option value="tier">Tier</option>
                <option value="name">Name</option>
              </Select>
            </div>
            <ToggleGroup
              className="ml-auto"
              value={effectiveView}
              onValueChange={(val) => {
                if (isMobileViewport) return;
                setView(val as "cards" | "list");
              }}
              options={[
                { value: "cards", label: "Cards" },
                { value: "list", label: "List" },
              ]}
            />
          </div>

          {effectiveView === "cards" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((node) => {
                const factionName = factionsById[node.factionId]?.name ?? "—";
                const formationProjects = (node.formationProjectIds ?? [])
                  .map((projectId) => formationProjectsById[projectId]?.title)
                  .filter((title): title is string => Boolean(title));
                const formationProjectLabel =
                  formationProjects.length === 0
                    ? "—"
                    : formationProjects.length === 1
                      ? formationProjects[0]
                      : `${formationProjects[0]} + ${
                          formationProjects.length - 1
                        }`;
                const cmTotals = node.cmTotals ?? {
                  lcm: 0,
                  mcm: 0,
                  acm: node.acm,
                };
                const tileItems = [
                  { label: "LCM", value: cmTotals.lcm.toString() },
                  { label: "MCM", value: cmTotals.mcm.toString() },
                  { label: "ACM", value: cmTotals.acm.toString() },
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
                        <h3 className="text-lg font-semibold">{node.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                          <span>{node.role}</span>
                          <Badge size="sm" variant="muted" title={node.id}>
                            {shortAddress(node.id)}
                          </Badge>
                        </div>
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
              {filtered.map((node) => (
                <Card key={node.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold">{node.name}</h4>
                        <p className="text-sm text-muted">{node.role}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge size="sm" variant="outline">
                          {factionsById[node.factionId]?.name ?? "—"}
                        </Badge>
                        <Badge size="sm">
                          <HintLabel termId="acm" className="mr-1">
                            ACM
                          </HintLabel>{" "}
                          {node.cmTotals?.acm ?? node.acm}
                        </Badge>
                        <Badge size="sm" variant="outline">
                          LCM {node.cmTotals?.lcm ?? 0}
                        </Badge>
                        <Badge size="sm" variant="outline">
                          MCM {node.cmTotals?.mcm ?? 0}
                        </Badge>
                        {node.formationCapable && (
                          <Badge size="sm" variant="outline">
                            Formation
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HumanNodes;
