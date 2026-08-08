import { CommandShortcuts } from "./CommandShortcuts";

export type CommandFooterProps = {
  isMac: boolean;
  activeLabel?: string;
};

export function CommandFooter({ isMac, activeLabel }: CommandFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
      <div className="flex items-center gap-3">
        <CommandShortcuts keys={["↑", "↓"]} label="Navigate" />
        <CommandShortcuts keys={["Enter"]} label="Open" />
        <CommandShortcuts keys={["Esc"]} label="Close" />
      </div>
      {activeLabel ? (
        <span className="hidden max-w-[35%] truncate text-[11px] text-muted-foreground sm:inline">
          {activeLabel}
        </span>
      ) : null}
      <CommandShortcuts keys={[isMac ? "⌘" : "Ctrl", "K"]} label="Toggle" />
    </div>
  );
}
