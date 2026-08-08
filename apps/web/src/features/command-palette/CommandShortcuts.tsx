import { cn } from "@/shared/lib/cn";

export type CommandShortcutsProps = {
  keys: readonly string[];
  label?: string;
  className?: string;
};

export function CommandShortcuts({ keys, label, className }: CommandShortcutsProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
      {label ? <span>{label}</span> : null}
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
