import { Outlet, Route, Routes } from "react-router";
import Welcome from "./Welcome";
import AppShell from "./AppShell";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        element={
          <AppShell>
            <Outlet />
          </AppShell>
        }
      >
        <Route path="/" element={<Welcome />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
