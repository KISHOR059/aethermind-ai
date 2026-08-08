import { useCallback, useEffect, useState } from "react";

import { env } from "@/shared/config/env";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { useAuth } from "../hooks/auth.context";
import { sessionActivity } from "./session-activity";

const CHECK_INTERVAL_MS = 15_000;

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function SessionManager() {
  const { signOut, refreshSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const cleanupActivity = sessionActivity.init();

    const interval = window.setInterval(() => {
      const idleMs = Date.now() - sessionActivity.getLastActivity();

      if (idleMs >= env.sessionInactivityTimeoutMs) {
        void signOut("session-expired");
        return;
      }

      const remaining = env.sessionInactivityTimeoutMs - idleMs;
      setRemainingMs(remaining);
      setShowWarning(remaining <= env.sessionWarningMs);
    }, CHECK_INTERVAL_MS);

    return () => {
      cleanupActivity();
      window.clearInterval(interval);
    };
  }, [signOut]);

  const continueSession = useCallback(async () => {
    const user = await refreshSession();

    if (!user) {
      void signOut("session-expired");
      return;
    }

    sessionActivity.touch();
    setShowWarning(false);
  }, [refreshSession, signOut]);

  return (
    <Dialog open={showWarning} onOpenChange={() => setShowWarning(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your session will expire soon</DialogTitle>
          <DialogDescription>
            You will be signed out automatically in {formatRemaining(remainingMs)} unless
            you continue your session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              void signOut("user");
            }}
          >
            Sign Out
          </Button>
          <Button onClick={() => void continueSession()}>Continue Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionManager;
