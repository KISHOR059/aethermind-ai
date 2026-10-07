import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";

function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          404 - Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you requested could not be found or may have moved.
        </p>
        <div className="pt-2">
          <Button asChild size="sm">
            <Link to="/dashboard">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
