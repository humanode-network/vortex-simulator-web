import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#4f6ad7",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8fb4ff",
    },
    background: {
      default: "#f2f5ff",
      paper: "#f9fbff",
    },
    text: {
      primary: "#111827",
      secondary: "#5d6475",
    },
    divider: "rgba(17, 24, 39, 0.12)",
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: `"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`,
    h1: { fontWeight: 600, fontSize: "1.9rem" },
    h2: { fontWeight: 600, fontSize: "1.45rem" },
    h3: { fontWeight: 600, fontSize: "1.2rem" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(17, 24, 39, 0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});
