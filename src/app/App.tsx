import { BrowserRouter } from "react-router";
import AppRoutes from "./AppRoutes";
import "../styles/base.css";
import "../styles/global.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
