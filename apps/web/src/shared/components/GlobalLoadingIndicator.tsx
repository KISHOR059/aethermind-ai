import { useGlobalLoading } from "@/shared/lib/request-state";

function GlobalLoadingIndicator() {
  const isLoading = useGlobalLoading();

  return (
    <div aria-live="polite" aria-label="Loading" className="pointer-events-none fixed top-0 right-0 left-0 z-[100] h-0.5">
      {isLoading && <div className="h-full w-1/3 animate-pulse bg-primary" />}
    </div>
  );
}

export default GlobalLoadingIndicator;

