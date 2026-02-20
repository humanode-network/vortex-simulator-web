import { Navigate, Outlet, Route, Routes } from "react-router";
import AppShell from "./AppShell";
import HumanNodes from "../pages/human-nodes/HumanNodes";
import Proposals from "../pages/proposals/Proposals";
import Chambers from "../pages/chambers/Chambers";
import Formation from "../pages/formation/Formation";
import Invision from "../pages/invision/Invision";
import Vortexopedia from "../pages/Vortexopedia";
import Factions from "../pages/factions/Factions";
import Faction from "../pages/factions/Faction";
import FactionChannel from "../pages/factions/FactionChannel";
import FactionInitiative from "../pages/factions/FactionInitiative";
import FactionThreadCreate from "../pages/factions/FactionThreadCreate";
import FactionInitiativeCreate from "../pages/factions/FactionInitiativeCreate";
import FactionCreate from "../pages/factions/FactionCreate";
import ProposalPP from "../pages/proposals/ProposalPP";
import ProposalChamber from "../pages/proposals/ProposalChamber";
import ProposalFormation from "../pages/proposals/ProposalFormation";
import Profile from "../pages/profile/Profile";
import HumanNode from "../pages/human-nodes/HumanNode";
import Chamber from "../pages/chambers/Chamber";
import Feed from "../pages/feed/Feed";
import Courts from "../pages/courts/Courts";
import CMPanel from "../pages/cm/CMPanel";
import Courtroom from "../pages/courts/Courtroom";
import ProposalCreation from "../pages/proposals/ProposalCreation";
import MyGovernance from "../pages/MyGovernance";
import ProposalDrafts from "../pages/proposals/ProposalDrafts";
import ProposalDraft from "../pages/proposals/ProposalDraft";
import FullHistory from "../pages/human-nodes/FullHistory";
import Landing from "../pages/Landing";
import Paper from "../pages/Paper";
import Guide from "../pages/Guide";
import Settings from "../pages/settings/Settings";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/paper" element={<Paper />} />
      <Route path="/guide" element={<Guide />} />
      <Route
        path="/app"
        element={
          <AppShell>
            <Outlet />
          </AppShell>
        }
      >
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="feed" element={<Feed />} />
        <Route path="profile" element={<Profile />} />
        <Route path="factions" element={<Factions />} />
        <Route path="factions/new" element={<FactionCreate />} />
        <Route path="factions/:id" element={<Faction />} />
        <Route
          path="factions/:id/channels/:channelId"
          element={<FactionChannel />}
        />
        <Route
          path="factions/:id/channels/:channelId/threads/:threadId"
          element={<FactionChannel />}
        />
        <Route
          path="factions/:id/channels/:channelId/threads/new"
          element={<FactionThreadCreate />}
        />
        <Route
          path="factions/:id/initiatives"
          element={<FactionInitiative />}
        />
        <Route
          path="factions/:id/initiatives/:initiativeId"
          element={<FactionInitiative />}
        />
        <Route
          path="factions/:id/initiatives/new"
          element={<FactionInitiativeCreate />}
        />
        <Route path="human-nodes" element={<HumanNodes />} />
        <Route path="human-nodes/:id" element={<HumanNode />} />
        <Route path="human-nodes/:id/history" element={<FullHistory />} />
        <Route path="courts" element={<Courts />} />
        <Route path="courts/:id" element={<Courtroom />} />
        <Route path="cm" element={<CMPanel />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/drafts" element={<ProposalDrafts />} />
        <Route path="proposals/drafts/:id" element={<ProposalDraft />} />
        <Route path="proposals/new" element={<ProposalCreation />} />
        <Route path="proposals/:id/pp" element={<ProposalPP />} />
        <Route path="proposals/:id/chamber" element={<ProposalChamber />} />
        <Route path="proposals/:id/formation" element={<ProposalFormation />} />
        <Route path="chambers" element={<Chambers />} />
        <Route path="chambers/:id" element={<Chamber />} />
        <Route path="formation" element={<Formation />} />
        <Route path="invision" element={<Invision />} />
        <Route path="vortexopedia" element={<Vortexopedia />} />
        <Route path="settings" element={<Settings />} />
        <Route path="my-governance" element={<MyGovernance />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
