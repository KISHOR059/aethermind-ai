import { Bot, User as UserIcon } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader";
import { useAuth } from "@/features/auth/hooks/auth.context";
import SessionSettings from "@/features/auth/components/SessionSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import ThemeToggle from "@/features/theme/ThemeToggle";
import { Badge } from "@/shared/components/ui/badge";
import { env } from "@/shared/config/env";

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your account profile, theme preferences, and AI integration settings."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Account Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              Account Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Your registered account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground text-xs">Full Name</span>
              <span className="font-medium text-xs">{user ? `${user.firstName} ${user.lastName}` : "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground text-xs">Email Address</span>
              <span className="font-medium text-xs">{user?.email ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* System & Theme Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              AI & Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Theme toggle and AI pipeline status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground text-xs">Theme Preference</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground text-xs">AI Backend Engine</span>
              <Badge variant="secondary" className="text-xs font-mono">
                {env.appName} AI Pipeline
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionSettings />
    </div>
  );
}

export default SettingsPage;
