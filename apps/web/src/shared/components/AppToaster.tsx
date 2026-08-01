import { Toaster } from "sonner";

import { useTheme } from "@/app/ThemeProvider";

function AppToaster() {
  const { resolvedTheme } = useTheme();

  return <Toaster closeButton richColors theme={resolvedTheme} position="top-right" />;
}

export default AppToaster;

