import { buildHighlightSegments } from "./command-palette.service";
import type { CommandItemData } from "./command-palette.types";
import { cn } from "@/shared/lib/cn";

export type CommandItemProps = {
  item: CommandItemData;
  active: boolean;
  onSelect: () => void;
  onMouseMove: () => void;
  registerRef: (id: string, element: HTMLButtonElement | null) => void;
};

export function CommandItem({ item, active, onSelect, onMouseMove, registerRef }: CommandItemProps) {
  const { command, indices, onLabel } = item;
  const Icon = command.icon;
  const segments = onLabel && indices.length > 0 ? buildHighlightSegments(command.label, indices) : null;

  return (
    <button
      ref={(element) => registerRef(command.id, element)}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseMove={onMouseMove}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100",
        active ? "bg-accent text-accent-foreground" : "text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1 truncate">
        {segments ? (
          segments.map((segment, index) =>
            segment.highlighted ? (
              <mark
                key={`${segment.text}-${index}`}
                className="rounded-[2px] bg-primary/15 px-0 font-semibold text-foreground"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={`${segment.text}-${index}`}>{segment.text}</span>
            ),
          )
        ) : (
          command.label
        )}
      </span>
      {command.hint ? (
        <span className="shrink-0 text-xs text-muted-foreground">{command.hint}</span>
      ) : null}
    </button>
  );
}
