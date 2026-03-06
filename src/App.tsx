import { SnackbarProvider } from "notistack";
import { AppThemeProvider } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AppThemeProvider>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </SnackbarProvider>
    </AppThemeProvider>
  );
}
