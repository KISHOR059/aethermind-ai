import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";

import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "./notification.hooks";
import { NotificationItem } from "./NotificationItem";
import { NotificationEmpty } from "./NotificationEmpty";
import { NotificationSkeleton } from "./NotificationSkeleton";
import { NotificationFilters, type NotificationReadFilter } from "./NotificationFilters";
import type { NotificationTypeFilter } from "./notification.types";

type NotificationDrawerProps = {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function NotificationDrawer({
  children,
  defaultOpen = false,
  onOpenChange,
}: NotificationDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("ALL");
  const [readFilter, setReadFilter] = useState<NotificationReadFilter>("ALL");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent side="right" showCloseButton={false} className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <NotificationDrawerHeader onClose={() => handleOpenChange(false)} />
        <NotificationFilters
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          readFilter={readFilter}
          onReadChange={setReadFilter}
          onClear={() => {
            setTypeFilter("ALL");
            setReadFilter("ALL");
          }}
        />
        <NotificationList
          typeFilter={typeFilter}
          readFilter={readFilter}
          onOpenChange={handleOpenChange}
        />
      </SheetContent>
    </Sheet>
  );
}

function NotificationDrawerHeader({ onClose }: { onClose: () => void }) {
  const unreadQuery = useUnreadCount();
  const markAllRead = useMarkAllAsRead();

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
        <Bell className="size-4" />
        Notifications
        {unreadQuery.data && unreadQuery.data.count > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {unreadQuery.data.count} unread
          </span>
        )}
      </SheetTitle>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => markAllRead.mutate()}
        >
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Close notifications">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function NotificationList({
  typeFilter,
  readFilter,
  onOpenChange,
}: {
  typeFilter: NotificationTypeFilter;
  readFilter: NotificationReadFilter;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const query = useNotifications({
    limit: 50,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    isRead: readFilter === "ALL" ? undefined : readFilter === "READ",
  });

  const isLoading = query.isLoading;
  const hasError = query.isError;
  const hasFilters = typeFilter !== "ALL" || readFilter !== "ALL";
  const items = query.data?.items ?? [];

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotification.mutate(id);
    },
    [deleteNotification],
  );

  const handleItemClick = useCallback(
    (actionUrl?: string) => {
      if (actionUrl) {
        onOpenChange(false);
        navigate(actionUrl);
      }
    },
    [navigate, onOpenChange],
  );

  return (
    <ScrollArea className="flex-1">
      {isLoading ? (
        <NotificationSkeleton />
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <p className="mt-1 text-sm font-medium">Failed to load notifications</p>
          <p className="max-w-[220px] text-[13px] text-muted-foreground">
            Please try again in a moment.
          </p>
        </div>
      ) : items.length === 0 ? (
        <NotificationEmpty hasFilters={hasFilters} />
      ) : (
        items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
            onClick={handleItemClick}
          />
        ))
      )}
    </ScrollArea>
  );
}
