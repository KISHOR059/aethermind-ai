import { AppRouter } from "@/app/router";
import ThemeProvider from "@/app/ThemeProvider";
import QueryProvider from "@/app/QueryProvider";
import GlobalLoadingIndicator from "@/shared/components/GlobalLoadingIndicator";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

function App() {
  return (
    <QueryProvider>
      <GlobalLoadingIndicator />
      <ThemeProvider>
        <TooltipProvider>
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
