import { Navigate, Outlet, Route, Routes } from "react-router";
import AppShell from "./AppShell";
import HumanNodes from "../pages/human-nodes/HumanNodes";
import Proposals from "../pages/proposals/Proposals";
import Chambers from "../pages/chambers/Chambers";
import Formation from "../pages/formation/Formation";
import Invision from "../pages/invision/Invision";
import Factions from "../pages/factions/Factions";
import Faction from "../pages/factions/Faction";
import ProposalPP from "../pages/proposals/ProposalPP";
import ProposalChamber from "../pages/proposals/ProposalChamber";
import ProposalFormation from "../pages/proposals/ProposalFormation";
import Settings from "../pages/Settings";
import Profile from "../pages/profile/Profile";
import HumanNode from "../pages/human-nodes/HumanNode";
import Chamber from "../pages/chambers/Chamber";

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
        <Route path="/" element={<Navigate to="/profile" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/factions" element={<Factions />} />
        <Route path="/factions/:id" element={<Faction />} />
        <Route path="/human-nodes" element={<HumanNodes />} />
        <Route path="/human-nodes/:id" element={<HumanNode />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/:id/pp" element={<ProposalPP />} />
        <Route path="/proposals/:id/chamber" element={<ProposalChamber />} />
        <Route path="/proposals/:id/formation" element={<ProposalFormation />} />
        <Route path="/chambers" element={<Chambers />} />
        <Route path="/chambers/:id" element={<Chamber />} />
        <Route path="/formation" element={<Formation />} />
        <Route path="/invision" element={<Invision />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
