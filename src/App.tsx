import { SnackbarProvider } from "notistack";
import { AppThemeProvider } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import { ErrorProvider } from "./context/ErrorContext";
import ErrorBanner from "./components/common/ErrorBanner";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AppThemeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <ErrorProvider>
          <ErrorBanner />
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </ErrorProvider>
      </SnackbarProvider>
    </AppThemeProvider>
  );
}
