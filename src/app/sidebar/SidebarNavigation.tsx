import type { MouseEventHandler } from "react";
import { NavLink } from "react-router";
import {
  Newspaper,
  BookOpen,
  ChartNoAxesCombined,
  Flag,
  Vote,
  Landmark,
  Brain,
  Network,
  Rocket,
  Scale,
  ScrollText,
  Settings,
  User,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarMedallion } from "./SidebarMedallion";

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  badge?: "urgent";
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Governance",
    items: [
      { to: "/app/feed", label: "Feed", Icon: Newspaper, badge: "urgent" },
      { to: "/app/my-governance", label: "My governance", Icon: Vote },
      { to: "/app/proposals", label: "Proposals", Icon: FileText },
      { to: "/app/formation", label: "Formation", Icon: Rocket },
      { to: "/app/initiatives", label: "Initiatives", Icon: Network },
    ],
  },
  {
    label: "Institutions",
    items: [
      { to: "/app/chambers", label: "Chambers", Icon: Landmark },
      { to: "/app/factions", label: "Factions", Icon: Flag },
      { to: "/app/cm", label: "CM panel", Icon: Brain },
      { to: "/app/courts", label: "Courts", Icon: Scale },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/app/profile", label: "My profile", Icon: User },
      { to: "/app/invision", label: "Invision", Icon: ChartNoAxesCombined },
      { to: "/app/human-nodes", label: "Human nodes", Icon: Users },
      { to: "/app/vortexopedia", label: "Vortexopedia", Icon: BookOpen },
      { to: "/app/humanode-codex", label: "Humanode Codex", Icon: ScrollText },
      { to: "/app/settings", label: "Settings", Icon: Settings },
    ],
  },
];

export function SidebarNavigation({
  onNavigate,
  urgent,
}: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
  urgent: { count: number; label: string; hasMore: boolean } | null;
}) {
  return (
    <>
      <nav id="sidebar-nav" className="sidebar__nav" aria-label="Primary">
        {navGroups.map((group) => (
          <section
            className="sidebar__section"
            key={group.label}
            aria-label={group.label}
          >
            <h2 className="sidebar__sectionTitle">
              <span>{group.label}</span>
            </h2>
            {group.items.map(({ to, label, Icon, badge }) => {
              const count = badge === "urgent" ? urgent : null;
              return (
                <NavLink
                  key={to}
                  className={({ isActive }) =>
                    cn("sidebar__link", isActive && "sidebar__link--active")
                  }
                  to={to}
                  aria-label={label}
                  aria-describedby={count ? "sidebar-urgent-count" : undefined}
                  onClick={onNavigate}
                >
                  <SidebarMedallion Icon={Icon}>
                    {count ? (
                      <span className="sidebar__countBadge">{count.label}</span>
                    ) : null}
                  </SidebarMedallion>
                  <span className="sidebar__label">{label}</span>
                </NavLink>
              );
            })}
          </section>
        ))}
      </nav>
      {urgent ? (
        <span id="sidebar-urgent-count" className="sr-only" role="status">
          {urgent.count}
          {urgent.hasMore ? " or more" : ""} urgent feed items available
        </span>
      ) : null}
    </>
  );
}
