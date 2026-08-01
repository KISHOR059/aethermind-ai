import { AppRouter } from "@/app/router";
import ErrorBoundary from "@/app/ErrorBoundary";
import ThemeProvider from "@/app/ThemeProvider";
import QueryProvider from "@/app/QueryProvider";
import LoadingOverlay from "@/shared/components/LoadingOverlay";
import AppToaster from "@/shared/components/AppToaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

function App() {
  return (
    <QueryProvider>
      <LoadingOverlay />
      <ThemeProvider>
        <AppToaster />
        <TooltipProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
