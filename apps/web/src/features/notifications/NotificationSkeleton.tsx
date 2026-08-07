import { Skeleton } from "@/shared/components/ui/skeleton";
import { NotificationItemSkeletonRow } from "./NotificationItem";

export function NotificationSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }, (_, index) => (
        <NotificationItemSkeletonRow key={index} />
      ))}
    </div>
  );
}

export function NotificationBellSkeleton() {
  return <Skeleton className="size-9 rounded-lg" />;
}
