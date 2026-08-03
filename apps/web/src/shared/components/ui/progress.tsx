import * as React from "react";

import { cn } from "@/shared/lib/cn";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value?: number | null }) {
  const isIndeterminate = value === undefined || value === null;

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out",
          isIndeterminate && "animate-pulse bg-gradient-to-r from-primary/30 via-primary to-primary/30"
        )}
        style={{
          transform: isIndeterminate ? "none" : `translateX(-${100 - (value || 0)}%)`,
        }}
      />
    </div>
  );
}

export { Progress };
