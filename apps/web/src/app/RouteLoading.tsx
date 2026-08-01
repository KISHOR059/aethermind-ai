import { LoaderCircle } from "lucide-react";

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <LoaderCircle className="size-6 animate-spin text-primary" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export default RouteLoading;

