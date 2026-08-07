import { BellOff, FilterX } from "lucide-react";

type NotificationEmptyProps = {
  hasFilters?: boolean;
};

export function NotificationEmpty({ hasFilters = false }: NotificationEmptyProps) {
  const Icon = hasFilters ? FilterX : BellOff;

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-1 text-sm font-medium">
        {hasFilters ? "No matching notifications" : "You're all caught up"}
      </p>
      <p className="max-w-[220px] text-[13px] text-muted-foreground">
        {hasFilters
          ? "Try adjusting or clearing the filters to see more."
          : "Notifications about your tasks and AI insights will appear here."}
      </p>
    </div>
  );
}
