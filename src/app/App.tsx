import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@/app/auth/AuthContext";
import AppRoutes from "./AppRoutes";

const AppDocumentTitle: React.FC = () => {
  useEffect(() => {
    document.title = "Vortex Sim";
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppDocumentTitle />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
