const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        <a
          className="sidebar__link"
          data-nav-link="human-nodes"
          href="human-nodes.html"
        >
          Human nodes
        </a>
        <a
          className="sidebar__link"
          data-nav-link="proposals"
          href="proposals.html"
        >
          Proposals
        </a>
        <a
          className="sidebar__link sidebar__link--active"
          data-nav-link="chambers"
          aria-current="page"
          href="chambers.html"
        >
          Chambers
        </a>
        <a
          className="sidebar__link"
          data-nav-link="formation"
          href="formation.html"
        >
          Formation
        </a>
        <a
          className="sidebar__link"
          data-nav-link="invision"
          href="invision.html"
        >
          Invision
        </a>
      </nav>

      {children}
    </aside>
  );
};

export default AppShell;
