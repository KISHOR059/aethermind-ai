import { Bell } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useUnreadCount } from "./notification.hooks";

type NotificationBellProps = {
  onClick?: () => void;
};

export function NotificationBell({ onClick }: NotificationBellProps) {
  const unreadQuery = useUnreadCount();
  const count = unreadQuery.data?.count ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
    >
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
