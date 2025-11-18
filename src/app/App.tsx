import { BrowserRouter } from "react-router";
import { CssBaseline, ThemeProvider } from "@mui/material";
import AppRoutes from "./AppRoutes";
import { theme } from "./theme";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
