import { AppRouter } from "@/app/router";
import ThemeProvider from "@/app/ThemeProvider";
import QueryProvider from "@/app/QueryProvider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider>
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
