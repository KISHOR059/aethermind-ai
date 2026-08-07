import { CalendarClock, CheckCheck, FolderKanban, Settings2, Sparkles, Trash2, TrendingUp } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import type { Notification, NotificationType } from "./notification.types";

const TYPE_ICONS: Record<NotificationType, typeof Sparkles> = {
  TASK: FolderKanban,
  AI: Sparkles,
  SYSTEM: Settings2,
  PRODUCTIVITY: TrendingUp,
  REMINDER: CalendarClock,
};

const TYPE_STYLES: Record<NotificationType, string> = {
  TASK: "text-sky-500",
  AI: "text-violet-500",
  SYSTEM: "text-zinc-500",
  PRODUCTIVITY: "text-emerald-500",
  REMINDER: "text-amber-500",
};

const PRIORITY_DOT: Record<Notification["priority"], string> = {
  LOW: "bg-zinc-400",
  NORMAL: "bg-sky-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-rose-500",
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days === 1 ? "yesterday" : `${days} days ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (actionUrl?: string) => void;
};

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClick?.(notification.actionUrl);
  };

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
        !notification.isRead && "bg-muted/30 hover:bg-muted/60",
      )}
      onClick={handleClick}
      aria-label={`${notification.title}. ${notification.message}. ${timeAgo(notification.createdAt)}. ${notification.priority} priority`}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border">
        <Icon className={cn("size-4", TYPE_STYLES[notification.type])} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm font-medium",
              !notification.isRead && "font-semibold",
            )}
          >
            {notification.title}
          </p>
          <span className={cn("ml-auto size-1.5 shrink-0 rounded-full", PRIORITY_DOT[notification.priority])} title={`${notification.priority} priority`} aria-hidden="true" />
          <span className="sr-only">{notification.priority} priority</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo(notification.createdAt)}</p>
      </div>

      <div className="mt-0.5 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label="Mark as read"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <CheckCheck className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-destructive hover:text-destructive"
          aria-label="Delete notification"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {!notification.isRead && (
        <div className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-primary/70" aria-hidden="true" />
      )}

      <Separator className="absolute right-0 bottom-0 left-4" />
    </button>
  );
}

export function NotificationItemSkeletonRow() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="size-8 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
