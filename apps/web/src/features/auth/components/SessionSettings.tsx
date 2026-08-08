import { useQueryClient } from "@tanstack/react-query";

import { env } from "@/shared/config/env";
import { notify } from "@/shared/lib/notifications";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MonitorSmartphone } from "lucide-react";

import {
  authKeys,
  useLogoutAllSessions,
  useRevokeSession,
  useSessions,
} from "../hooks/auth.hooks";
import { useAuth } from "../hooks/auth.context";
import type { SessionInfo } from "../types";

function parseDevice(userAgent?: string) {
  if (!userAgent) {
    return "Unknown device";
  }

  let browser = "Unknown browser";
  if (/Firefox\//.test(userAgent)) browser = "Firefox";
  else if (/Edg\//.test(userAgent)) browser = "Edge";
  else if (/Chrome\//.test(userAgent)) browser = "Chrome";
  else if (/Safari\//.test(userAgent)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/.test(userAgent)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(userAgent)) os = "macOS";
  else if (/Android/.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";
  else if (/Linux/.test(userAgent)) os = "Linux";

  return `${browser} · ${os}`;
}

function formatRelativeTime(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatExpiry(value: string) {
  const minutes = Math.floor((new Date(value).getTime() - Date.now()) / 60_000);

  if (minutes <= 0) return "expired";
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function SessionSettings() {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: sessions, isLoading } = useSessions();
  const revokeMutation = useRevokeSession();
  const logoutAllMutation = useLogoutAllSessions();

  const refreshSessions = () => {
    void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
  };

  const signOutSession = async (session: SessionInfo) => {
    try {
      await revokeMutation.mutateAsync(session.id);

      if (session.isCurrent) {
        await signOut();
        return;
      }

      refreshSessions();
    } catch {
      notify.error("Unable to sign out that device");
    }
  };

  const signOutOthers = async () => {
    const others = (sessions ?? []).filter((session) => !session.isCurrent);

    try {
      for (const session of others) {
        await revokeMutation.mutateAsync(session.id);
      }

      notify.success(
        others.length === 1
          ? "Signed out 1 other device"
          : `Signed out ${others.length} other devices`,
      );
      refreshSessions();
    } catch {
      notify.error("Unable to sign out other devices");
    }
  };

  const hasOtherSessions = (sessions?.length ?? 0) > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MonitorSmartphone className="size-4 text-primary" />
          Active Sessions
        </CardTitle>
        <CardDescription className="text-xs">
          Devices currently signed in to your {env.appName} account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : !sessions || sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <>
            <ul className="divide-y divide-border/40">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {parseDevice(session.userAgent)}
                      </span>
                      {session.isCurrent && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          This device
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {session.ipAddress ?? "Unknown IP"} · Last active{" "}
                      {formatRelativeTime(session.lastActivityAt)} · Expires{" "}
                      {formatExpiry(session.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => void signOutSession(session)}
                    disabled={revokeMutation.isPending}
                  >
                    Sign out
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signOutOthers()}
              disabled={logoutAllMutation.isPending || !hasOtherSessions}
            >
              Sign Out All Other Sessions
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SessionSettings;
