import AppSidebar from "./AppSidebar";
import MainAtmosphere from "./MainAtmosphere";

import "./AppShell.css";

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <a
        className="skip-link focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none"
        href="#main"
      >
        Skip to content
      </a>

      <div className="app-shell">
        <AppSidebar />

        <main id="main" className="workspace" tabIndex={-1}>
          <MainAtmosphere />
          {children}
        </main>
      </div>
    </>
  );
};

export default AppShell;
