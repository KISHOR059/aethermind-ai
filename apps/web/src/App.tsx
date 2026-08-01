import { AppRouter } from "@/app/router";
import ErrorBoundary from "@/app/ErrorBoundary";
import ThemeProvider from "@/app/ThemeProvider";
import QueryProvider from "@/app/QueryProvider";
import LoadingOverlay from "@/shared/components/LoadingOverlay";
import AppToaster from "@/shared/components/AppToaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import AuthProvider from "@/features/auth/hooks/AuthProvider";

function App() {
  return (
    <QueryProvider>
      <LoadingOverlay />
      <ThemeProvider>
        <AppToaster />
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <AppRouter />
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
