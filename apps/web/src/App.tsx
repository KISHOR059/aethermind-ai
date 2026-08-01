import { AppRouter } from "@/app/router";
import ThemeProvider from "@/app/ThemeProvider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppRouter />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
