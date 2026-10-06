import { NavLink } from "react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import "./AppSidebar.css";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { SidebarAccount } from "@/app/auth/SidebarAccount";
import { Button } from "@/components/primitives/button";
import humanodeLogo from "@/assets/humanode-logo.png";
import { useUrgentFeedBadge } from "./useUrgentFeedBadge";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";

const AppSidebar: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const expanded = hoverOpen || focusOpen;
  const urgent = useUrgentFeedBadge();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 961px)");
    const resetMobileMenu = () => {
      if (desktop.matches) setMobileNavOpen(false);
    };
    desktop.addEventListener("change", resetMobileMenu);
    return () => desktop.removeEventListener("change", resetMobileMenu);
  }, []);

  const closeMobileNav = () =>
    setMobileNavOpen((open) => (open ? false : open));

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (event.detail > 0) event.currentTarget.blur();
    closeMobileNav();
    const destination = event.currentTarget.pathname;
    window.requestAnimationFrame(() => {
      if (window.location.pathname === destination)
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  };

  return (
    <aside
      className={clsx(
        "sidebar",
        expanded && "sidebar--expanded",
        mobileNavOpen && "sidebar--mobileOpen",
      )}
      onMouseLeave={(event) => {
        setHoverOpen(false);
        if (!event.currentTarget.contains(document.activeElement)) {
          setFocusOpen(false);
        }
      }}
      onFocusCapture={() => setFocusOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setFocusOpen(false);
          if (event.relatedTarget) closeMobileNav();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setMobileNavOpen(false);
          setHoverOpen(false);
          setFocusOpen(false);
          if (
            mobileNavOpen &&
            mobileToggleRef.current?.getClientRects().length
          ) {
            mobileToggleRef.current.focus({ preventScroll: true });
          } else {
            (document.activeElement as HTMLElement | null)?.blur();
          }
        }
      }}
    >
      <div className="sidebar__surface" onMouseEnter={() => setHoverOpen(true)}>
        <div className="sidebar__brand">
          <NavLink
            className="sidebar__brandLink"
            to="/app/feed"
            aria-label="Vortex"
            onClick={handleNavigation}
          >
            <span className="sidebar__brandMark">
              <img src={humanodeLogo} className="sidebar__brandImage" alt="" />
            </span>
            <span className="sidebar__brandIdentity">
              <span className="sidebar__brandName">Vortex</span>
            </span>
          </NavLink>
          <Button
            ref={mobileToggleRef}
            type="button"
            size="iconMd"
            variant="ghost"
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
          </Button>
        </div>
        <div className="sidebar__mobilePanel">
          <SidebarAccount onNavigate={handleNavigation} />
        </div>
        <SidebarNavigation onNavigate={handleNavigation} urgent={urgent} />
      </div>
    </aside>
  );
};

export default AppSidebar;
