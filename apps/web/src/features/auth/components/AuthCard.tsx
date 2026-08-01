import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { env } from "@/shared/config/env";

type AuthCardProps = { title: string; description: string; footer: ReactNode; children: ReactNode };

function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link className="block text-center text-lg font-semibold tracking-tight" to="/login">{env.appName}</Link>
        <Card>
          <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}

export default AuthCard;

