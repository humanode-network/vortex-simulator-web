import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router";
import { AuthProvider } from "@/app/auth/AuthContext";
import AppRoutes from "./AppRoutes";

const ScrollToTopOnRouteChange: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "Vortex Sim";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
