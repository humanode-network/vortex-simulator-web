import { NavLink } from "react-router";
import "./AppSidebar.css";
import clsx from "clsx";

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx("sidebar__link", isActive && "sidebar__link--active");

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        <NavLink className={navClass} to="/feed">
          Feed
        </NavLink>
        <NavLink className={navClass} to="/proposals">
          Proposals
        </NavLink>
        <NavLink className={navClass} to="/chambers">
          Chambers
        </NavLink>
        <NavLink className={navClass} to="/human-nodes">
          Human nodes
        </NavLink>
        <NavLink className={navClass} to="/formation">
          Formation
        </NavLink>
        <NavLink className={navClass} to="/cm">
          CM panel
        </NavLink>
        <NavLink className={navClass} to="/invision">
          Invision
        </NavLink>
        <NavLink className={navClass} to="/courts">
          Courts
        </NavLink>
        <details className="group">
          <summary className="cursor-pointer list-none">
            <NavLink className={navClass} to="/settings">
              Settings
            </NavLink>
          </summary>
          <div className="pl-4 pt-1">
            <NavLink className={navClass} to="/profile">
              My profile
            </NavLink>
          </div>
        </details>
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
