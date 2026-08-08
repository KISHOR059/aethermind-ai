import type { ReactNode } from "react";

export type CommandGroupProps = {
  label: string;
  children: ReactNode;
};

export function CommandGroup({ label, children }: CommandGroupProps) {
  return (
    <div role="group" aria-label={label} className="mb-1">
      <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
