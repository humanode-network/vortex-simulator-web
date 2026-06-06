import { NavLink } from "react-router";
import { useState } from "react";
import "./AppSidebar.css";
import clsx from "clsx";
import {
  Activity,
  BookOpen,
  Eye,
  Flag,
  Gavel,
  Landmark,
  Lightbulb,
  Rocket,
  Scale,
  Settings,
  User,
  Users,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { AuthSidebarPanel } from "@/app/auth/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx("sidebar__link", isActive && "sidebar__link--active");

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () =>
    setMobileNavOpen((open) => (open ? false : open));

  const navGroups: NavGroup[] = [
    {
      label: "Governance",
      items: [
        { to: "/app/feed", label: "Feed", Icon: Activity },
        { to: "/app/my-governance", label: "My governance", Icon: Gavel },
        { to: "/app/proposals", label: "Proposals", Icon: FileText },
        { to: "/app/formation", label: "Formation", Icon: Rocket },
      ],
    },
    {
      label: "Institutions",
      items: [
        { to: "/app/chambers", label: "Chambers", Icon: Lightbulb },
        { to: "/app/factions", label: "Factions", Icon: Flag },
        { to: "/app/cm", label: "CM panel", Icon: Scale },
        { to: "/app/courts", label: "Courts", Icon: Landmark },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/app/profile", label: "My profile", Icon: User },
        { to: "/app/invision", label: "Invision", Icon: Eye },
        { to: "/app/human-nodes", label: "Human nodes", Icon: Users },
        { to: "/app/vortexopedia", label: "Vortexopedia", Icon: BookOpen },
        { to: "/app/settings", label: "Settings", Icon: Settings },
      ],
    },
  ];

  return (
    <aside className={clsx("sidebar", mobileNavOpen && "sidebar--mobileOpen")}>
      <div className="sidebar__brand">
        <span>Vortex</span>
        <button
          type="button"
          className="sidebar__mobileToggle"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="sidebar-nav"
          aria-label={
            mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {mobileNavOpen ? (
            <X className="sidebar__mobileToggleIcon" aria-hidden="true" />
          ) : (
            <Menu className="sidebar__mobileToggleIcon" aria-hidden="true" />
          )}
        </button>
      </div>
      <div className="sidebar__mobilePanel">
        <AuthSidebarPanel />
      </div>
      <nav id="sidebar-nav" className="sidebar__nav" aria-label="Primary">
        {navGroups.map((group) => (
          <div className="sidebar__section" key={group.label}>
            <div className="sidebar__sectionTitle">{group.label}</div>
            {group.items.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                className={navClass}
                to={to}
                onClick={closeMobileNav}
              >
                <Icon className="sidebar__icon" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
