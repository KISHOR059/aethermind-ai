import { Link } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";

function UnauthorizedPage() {
  return <main className="flex min-h-screen items-center justify-center px-4"><div className="space-y-4 text-center"><h1 className="text-3xl font-semibold">Unauthorized</h1><p className="text-muted-foreground">You do not have permission to view this page.</p><Button asChild><Link to="/dashboard">Return to dashboard</Link></Button></div></main>;
}

export default UnauthorizedPage;

